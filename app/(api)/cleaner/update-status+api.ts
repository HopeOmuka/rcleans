import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

const VALID_STATUSES = ["matched", "arrived", "in_progress", "completed"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  matched: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

const NOTIF_CONFIG: Record<string, { type: string; title: string; message: string }> = {
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

    const currentResult = await sql`
      SELECT status FROM services WHERE id = ${jobId}
    `;
    if (currentResult.length === 0) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }

    const currentStatus = currentResult[0].status as string;
    if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
      throw new AppError(
        400,
        `Cannot transition from "${currentStatus}" to "${status}"`,
        "INVALID_TRANSITION",
      );
    }

    let result;
    if (status === "arrived") {
      result = await sql`
        UPDATE services SET status = ${status}, matched_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} RETURNING id, status, cleaner_id
      `;
    } else if (status === "in_progress") {
      result = await sql`
        UPDATE services SET status = ${status}, started_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} RETURNING id, status, cleaner_id
      `;
    } else if (status === "completed") {
      result = await sql`
        UPDATE services SET status = ${status}, completed_at = NOW(), updated_at = NOW()
        WHERE id = ${jobId} RETURNING id, status, cleaner_id
      `;
    } else {
      result = await sql`
        UPDATE services SET status = ${status}, updated_at = NOW()
        WHERE id = ${jobId} RETURNING id, status, cleaner_id
      `;
    }

    if (result.length === 0) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }

    const notif = NOTIF_CONFIG[status];
    if (notif) {
      const serviceData = await sql`
        SELECT user_id FROM services WHERE id = ${jobId}
      `;
      if (serviceData.length > 0) {
        await sql`
          INSERT INTO notifications (user_id, service_id, type, title, message, data)
          VALUES (
            ${serviceData[0].user_id}, ${jobId}, ${notif.type},
            ${notif.title}, ${notif.message},
            ${JSON.stringify({ service_id: jobId, status })}
          )
        `;
      }
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error updating job status");
  }
}
