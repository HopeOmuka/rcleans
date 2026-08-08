import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";

const RESCHEDULABLE_STATUSES = ["requested", "matched", "confirmed"] as const;

function humanDate(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Reschedules a service as its owning customer.
 * - Only "requested" / "matched" / "confirmed" bookings can be rescheduled.
 * - The assigned cleaner (if any) gets a "system_message" notification.
 * - Pricing and payment are unchanged.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`service:reschedule:${auth.userId}`, 10, 60_000);
    const body = await request.json();
    const { serviceId, scheduledDate } = body;

    if (!serviceId) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
    }

    const scheduled = new Date(scheduledDate);
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
      WHERE id = ${serviceId}
    `;
    if (!service) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }
    if (service.user_id !== auth.userId) {
      throw new AppError(
        403,
        "Not authorized to reschedule this service",
        "FORBIDDEN",
      );
    }
    if (
      !(RESCHEDULABLE_STATUSES as readonly string[]).includes(service.status)
    ) {
      throw new AppError(
        400,
        `Cannot reschedule a service with status "${service.status}"`,
        "INVALID_STATUS",
      );
    }

    // Atomic: re-verify the status inside the UPDATE.
    const result = await sql`
      UPDATE services
      SET scheduled_date = ${scheduled.toISOString()}, updated_at = NOW()
      WHERE id = ${serviceId}
        AND status IN ('requested', 'matched', 'confirmed')
      RETURNING id, status, scheduled_date
    `;
    if (result.length === 0) {
      throw new AppError(
        409,
        "Service status changed by another request",
        "CONFLICT",
      );
    }

    if (service.cleaner_id) {
      const notice = `Your booking was rescheduled to ${humanDate(scheduled)}.`;
      await sql`
        INSERT INTO notifications (
          cleaner_id, service_id, type, title, message, data
        )
        VALUES (
          ${service.cleaner_id}, ${serviceId}, 'system_message',
          'Booking Rescheduled', ${notice},
          ${JSON.stringify({ service_id: serviceId })}
        )
      `;
      void sendPush({
        cleanerId: service.cleaner_id,
        title: "Booking Rescheduled",
        body: notice,
        data: { service_id: serviceId },
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
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error rescheduling service");
  }
}
