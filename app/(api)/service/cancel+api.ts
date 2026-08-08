import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";
const CANCELLABLE_STATUSES = ["requested", "matched", "confirmed"] as const;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Cancels a service as its owning customer.
 * - Only "requested" / "matched" / "confirmed" bookings can be cancelled.
 * - If payment was captured, attempts a Stripe refund for the full amount.
 * - The assigned cleaner (if any) gets a "system_message" notification.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`service:cancel:${auth.userId}`, 10, 60_000);
    const body = await request.json();
    const { serviceId, reason } = body;

    if (!serviceId) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
    }
    if (reason && (typeof reason !== "string" || reason.length > 500)) {
      throw new AppError(
        400,
        "Reason too long (max 500 chars)",
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT id, user_id, cleaner_id, status, payment_status,
             stripe_payment_intent_id, total_price
      FROM services
      WHERE id = ${serviceId}
    `;
    if (!service) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }
    if (service.user_id !== auth.userId) {
      throw new AppError(
        403,
        "Not authorized to cancel this service",
        "FORBIDDEN",
      );
    }
    if (!CANCELLABLE_STATUSES.includes(service.status)) {
      throw new AppError(
        400,
        `Cannot cancel a service with status "${service.status}"`,
        "INVALID_STATUS",
      );
    }

    // Atomic: re-verify the status inside the UPDATE.
    const result = await sql`
      UPDATE services
      SET status = 'cancelled', cancelled_at = NOW(),
          cancellation_reason = ${reason || null}, updated_at = NOW()
      WHERE id = ${serviceId}
        AND status IN ('requested', 'matched', 'confirmed')
      RETURNING id, status
    `;
    if (result.length === 0) {
      throw new AppError(
        409,
        "Service status changed by another request",
        "CONFLICT",
      );
    }

    let refundStatus: "refunded" | "failed" | "not_applicable" =
      "not_applicable";
    if (service.stripe_payment_intent_id) {
      try {
        if (service.payment_status === "paid") {
          // Money was captured — give it back.
          await stripe.refunds.create({
            payment_intent: service.stripe_payment_intent_id,
          });
        } else if (service.payment_status === "authorized") {
          // Money is only held (manual capture), not taken — releasing the
          // hold returns it to the customer with no refund call needed.
          await stripe.paymentIntents.cancel(service.stripe_payment_intent_id);
        }
        await sql`
          UPDATE services SET payment_status = 'refunded', updated_at = NOW()
          WHERE id = ${serviceId}
        `;
        refundStatus = "refunded";
      } catch (err) {
        console.error("Refund failed:", err);
        refundStatus = "failed";
      }
    }

    if (service.cleaner_id) {
      const notice = reason
        ? `The customer cancelled this booking. Reason: ${reason}`
        : "The customer cancelled this booking.";
      await sql`
        INSERT INTO notifications (
          cleaner_id, service_id, type, title, message, data
        )
        VALUES (
          ${service.cleaner_id}, ${serviceId}, 'system_message',
          'Booking Cancelled', ${notice},
          ${JSON.stringify({ service_id: serviceId })}
        )
      `;
      void sendPush({
        cleanerId: service.cleaner_id,
        title: "Booking Cancelled",
        body: notice,
        data: { service_id: serviceId },
      });
    }

    return jsonResponse({
      data: {
        id: result[0].id,
        status: "cancelled",
        refund_status: refundStatus,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error cancelling service");
  }
}
