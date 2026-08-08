import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Cleaner declines a job the customer reserved for them (cleaner_id = me).
 * - The job goes back to the open pool (cleaner_id = NULL, status requested).
 * - Money is returned: a captured charge (paid) is refunded; a hold
 *   (authorized) is released with no refund move needed.
 * - The customer gets a notification that their request was declined.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      throw new AppError(400, "Job ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT id, user_id, cleaner_id, status, payment_status,
             stripe_payment_intent_id
      FROM services
      WHERE id = ${jobId}
    `;
    if (!service) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }
    if (service.cleaner_id !== auth.cleanerId) {
      throw new AppError(409, "This job is not reserved for you", "CONFLICT");
    }
    // Only a still-requested job (not started, not accepted/completed) can be
    // denied back to the pool.
    if (service.status !== "requested") {
      throw new AppError(
        409,
        `Cannot deny a job with status "${service.status}"`,
        "CONFLICT",
      );
    }

    // Release the money BEFORE flipping payment_status so we know what was
    // actually paid. Succeeded-intent = captured => refund. Manual capture
    // holds never took money; cancelling releases them.
    let releaseOutcome: "refund" | "hold_released" | "none" = "none";
    if (service.stripe_payment_intent_id) {
      try {
        if (service.payment_status === "paid") {
          await stripe.refunds.create({
            payment_intent: service.stripe_payment_intent_id,
          });
          releaseOutcome = "refund";
        } else if (service.payment_status === "authorized") {
          await stripe.paymentIntents.cancel(service.stripe_payment_intent_id);
          releaseOutcome = "hold_released";
        }
      } catch (err) {
        console.error("Deny: failed to release payment:", err);
      }
    }

    const result = await sql`
      UPDATE services
      SET cleaner_id = NULL,
          payment_status = ${service.payment_status === "paid" || service.payment_status === "authorized" ? "refunded" : "pending"},
          stripe_payment_intent_id = NULL, updated_at = NOW()
      WHERE id = ${jobId}
        AND cleaner_id = ${auth.cleanerId}
        AND status = 'requested'
      RETURNING id, status, cleaner_id, payment_status
    `;

    if (result.length === 0) {
      throw new AppError(409, "Job changed while denying", "CONFLICT");
    }

    await sql`
      INSERT INTO notifications (user_id, service_id, type, title, message, data)
      VALUES (
        ${service.user_id}, ${jobId}, 'cleaner_declined',
        'Cleaner declined the request',
        'Your preferred cleaner could not take this job. It is back on the open list — no charge was made.',
        ${JSON.stringify({ service_id: jobId })}
      )
    `;
    void sendPush({
      userId: service.user_id,
      title: "Cleaner declined the request",
      body: "Your preferred cleaner could not take this job. No charge was made.",
      data: { service_id: jobId },
    });

    return jsonResponse({
      data: {
        id: jobId,
        status: "requested",
        payment_status: result[0].payment_status,
        payment_released: releaseOutcome,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error denying job");
  }
}
