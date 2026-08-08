import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";

const VALID_STATUSES = [
  "matched",
  "arrived",
  "in_progress",
  "completed",
] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  matched: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

const NOTIF_CONFIG: Record<
  string,
  { type: string; title: string; message: string }
> = {
  arrived: {
    type: "service_started",
    title: "Cleaner Arrived",
    message: "Your cleaner has arrived at the location.",
  },
  in_progress: {
    type: "service_started",
    title: "Service Started",
    message: "Your cleaner has started the service.",
  },
  completed: {
    type: "service_completed",
    title: "Service Completed",
    message: "Your cleaning service has been completed!",
  },
};

export async function POST(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);
    const body = await request.json();
    const { jobId, status } = body;

    if (!jobId || !status) {
      throw new AppError(400, "Job ID and status required", "VALIDATION_ERROR");
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(
        400,
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT status, cleaner_id, user_id FROM services WHERE id = ${jobId}
    `;
    if (!service) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }
    if (String(service.cleaner_id) !== auth.cleanerId) {
      throw new AppError(403, "Not authorized to update this job", "FORBIDDEN");
    }

    const currentStatus = service.status as string;
    if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
      throw new AppError(
        400,
        `Cannot transition from "${currentStatus}" to "${status}"`,
        "INVALID_TRANSITION",
      );
    }

    // Atomic: re-verify current status inside the UPDATE.
    let result;
    if (status === "arrived") {
      result = await sql`
        UPDATE services SET status = 'arrived', matched_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} AND status = 'matched'
        RETURNING id, status, cleaner_id
      `;
    } else if (status === "in_progress") {
      result = await sql`
        UPDATE services SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} AND status = 'arrived'
        RETURNING id, status, cleaner_id
      `;
    } else if (status === "completed") {
      result = await sql`
        UPDATE services SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} AND status = 'in_progress'
        RETURNING id, status, cleaner_id
      `;
    } else {
      result = await sql`
        UPDATE services SET status = ${status}, updated_at = NOW()
        WHERE id = ${jobId} AND status = ${currentStatus}
        RETURNING id, status, cleaner_id
      `;
    }

    if (result.length === 0) {
      throw new AppError(
        409,
        "Job status changed by another request",
        "CONFLICT",
      );
    }

    const notif = NOTIF_CONFIG[status];
    if (notif) {
      await sql`
        INSERT INTO notifications (user_id, service_id, type, title, message, data)
        VALUES (
          ${service.user_id}, ${jobId}, ${notif.type},
          ${notif.title}, ${notif.message},
          ${JSON.stringify({ service_id: jobId, status })}
        )
      `;
      void sendPush({
        userId: service.user_id,
        title: notif.title,
        body: notif.message,
        data: { service_id: jobId, status },
      });
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating job status");
  }
}
