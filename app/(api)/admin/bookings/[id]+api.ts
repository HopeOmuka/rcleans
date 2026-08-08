import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";
import { sendPush } from "@/lib/push";

const CANCELLABLE_STATUSES = ["requested", "matched", "confirmed"] as const;

const RESCHEDULABLE_STATUSES = CANCELLABLE_STATUSES;

function humanDate(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const COERCE = [
  "total_price",
  "discount_amount",
  "estimated_duration",
  "actual_duration",
  "rating",
] as const;

function coerceNums(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] =
      (COERCE as readonly string[]).includes(k) && v != null ? Number(v) : v;
  }
  return out;
}

export async function GET(request: Request, params: { id?: string }) {
  try {
    await requireAdminAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);
    const rows = await sql`
      SELECT
        s.id, s.status, s.total_price, s.discount_amount, s.payment_status,
        s.created_at, s.scheduled_date, s.matched_at, s.started_at,
        s.completed_at, s.cancelled_at, s.cancellation_reason,
        s.stripe_payment_intent_id,
        s.location_address, s.location_lat, s.location_lng,
        s.special_instructions, s.estimated_duration, s.actual_duration,
        st.name AS service_type_name,
        u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
        c.first_name AS cleaner_first_name, c.last_name AS cleaner_last_name,
        c.email AS cleaner_email, c.phone AS cleaner_phone,
        c.profile_image_url AS cleaner_image
      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      WHERE s.id = ${params?.id}
    `;

    if (rows.length === 0) {
      throw new AppError(404, "Booking not found", "NOT_FOUND");
    }

    const booking = coerceNums(rows[0]);

    const addons = await sql`
      SELECT a.name, a.price, sel.quantity
      FROM service_addon_selections sel
      INNER JOIN service_addons a ON a.id = sel.addon_id
      WHERE sel.service_id = ${params?.id}
    `;

    const promo = await sql`
      SELECT pc.code, pc.discount_type, pc.discount_value
      FROM promo_codes pc
      INNER JOIN services s ON s.promo_code_id = pc.id
      WHERE s.id = ${params?.id}
    `;

    return jsonResponse({
      data: {
        ...booking,
        addons: addons.map((a) => ({
          ...a,
          quantity: Number(a.quantity),
          price: Number(a.price),
        })),
        promo_code: promo[0] ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching booking");
  }
}

export async function POST(request: Request, params: { id?: string }) {
  try {
    await requireAdminAuth(request);

    const body = await request.json();
    const { action } = body;
    if (action === "reschedule") {
      return handleReschedule(body, params);
    }
    if (action !== "cancel") {
      throw new AppError(
        400,
        'Unsupported action. Expected "cancel" or "reschedule"',
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT id, user_id, cleaner_id, status, payment_status,
             stripe_payment_intent_id, total_price
      FROM services
      WHERE id = ${params?.id}
    `;
    if (!service) {
      throw new AppError(404, "Booking not found", "NOT_FOUND");
    }
    if (!CANCELLABLE_STATUSES.includes(service.status)) {
      throw new AppError(
        400,
        `Cannot cancel a booking with status "${service.status}"`,
        "INVALID_STATUS",
      );
    }

    const result = await sql`
      UPDATE services
      SET status = 'cancelled', cancelled_at = NOW(),
          cancellation_reason = ${body.reason || "Cancelled by admin"},
          updated_at = NOW()
      WHERE id = ${service.id}
        AND status IN ('requested', 'matched', 'confirmed')
      RETURNING id, status
    `;
    if (result.length === 0) {
      throw new AppError(
        409,
        "Booking status changed by another request",
        "CONFLICT",
      );
    }

    let refundStatus: "refunded" | "failed" | "not_applicable" =
      "not_applicable";
    if (service.stripe_payment_intent_id) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        if (service.payment_status === "paid") {
          await stripe.refunds.create({
            payment_intent: service.stripe_payment_intent_id,
          });
        } else if (service.payment_status === "authorized") {
          await stripe.paymentIntents.cancel(service.stripe_payment_intent_id);
        }
        await sql`
          UPDATE services SET payment_status = 'refunded', updated_at = NOW()
          WHERE id = ${service.id}
        `;
        refundStatus = "refunded";
      } catch (err) {
        console.error("Refund failed:", err);
        refundStatus = "failed";
      }
    }

    if (service.cleaner_id) {
      await sql`
        INSERT INTO notifications (
          cleaner_id, service_id, type, title, message, data
        )
        VALUES (
          ${service.cleaner_id}, ${service.id}, 'system_message',
          'Booking Cancelled',
          'This booking was cancelled by the admin.',
          ${JSON.stringify({ service_id: service.id })}
        )
      `;
      void sendPush({
        cleanerId: service.cleaner_id,
        title: "Booking Cancelled",
        body: "This booking was cancelled by the admin.",
        data: { service_id: service.id },
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
    return errorResponse(error, "Error updating booking");
  }
}

async function handleReschedule(
  body: Record<string, unknown>,
  params: { id?: string },
): Promise<Response> {
  const { scheduledDate } = body;

  const scheduled = new Date(scheduledDate as string);
  if (isNaN(scheduled.getTime())) {
    throw new AppError(400, "Invalid scheduled date", "VALIDATION_ERROR");
  }
  if (scheduled.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new AppError(
      400,
      "New schedule must be in the future",
      "VALIDATION_ERROR",
    );
  }

  const sql = neon(`${process.env.DATABASE_URL}`);

  const [service] = await sql`
    SELECT id, user_id, cleaner_id, status, scheduled_date
    FROM services
    WHERE id = ${params?.id}
  `;
  if (!service) {
    throw new AppError(404, "Booking not found", "NOT_FOUND");
  }
  if (!(RESCHEDULABLE_STATUSES as readonly string[]).includes(service.status)) {
    throw new AppError(
      400,
      `Cannot reschedule a booking with status "${service.status}"`,
      "INVALID_STATUS",
    );
  }

  const result = await sql`
    UPDATE services
    SET scheduled_date = ${scheduled.toISOString()}, updated_at = NOW()
    WHERE id = ${service.id}
      AND status IN ('requested', 'matched', 'confirmed')
    RETURNING id, status, scheduled_date
  `;
  if (result.length === 0) {
    throw new AppError(
      409,
      "Booking status changed by another request",
      "CONFLICT",
    );
  }

  const notice = `Your booking was rescheduled to ${humanDate(scheduled)}.`;

  await sql`
    INSERT INTO notifications (
      user_id, service_id, type, title, message, data
    )
    VALUES (
      ${service.user_id}, ${service.id}, 'system_message',
      'Booking Rescheduled', ${notice},
      ${JSON.stringify({ service_id: service.id })}
    )
  `;
  void sendPush({
    userId: service.user_id,
    title: "Booking Rescheduled",
    body: notice,
    data: { service_id: service.id },
  });

  if (service.cleaner_id) {
    await sql`
      INSERT INTO notifications (
        cleaner_id, service_id, type, title, message, data
      )
      VALUES (
        ${service.cleaner_id}, ${service.id}, 'system_message',
        'Booking Rescheduled', ${notice},
        ${JSON.stringify({ service_id: service.id })}
      )
    `;
    void sendPush({
      cleanerId: service.cleaner_id,
      title: "Booking Rescheduled",
      body: notice,
      data: { service_id: service.id },
    });
  }

  return jsonResponse({
    data: {
      id: result[0].id,
      status: result[0].status,
      scheduled_date: result[0].scheduled_date,
      rescheduled: true,
    },
  });
}
