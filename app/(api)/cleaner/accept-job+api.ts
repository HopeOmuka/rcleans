import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, cleanerId } = body;

    if (!jobId || !cleanerId) {
      throw new AppError(400, "Job ID and Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const existing = await sql`
      SELECT status, cleaner_id FROM services WHERE id = ${jobId}
    `;
    if (existing.length === 0) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }

    if (existing[0].status !== "requested") {
      throw new AppError(400, "Job is not available for acceptance", "CONFLICT");
    }

    if (existing[0].cleaner_id) {
      throw new AppError(400, "Job already has a cleaner assigned", "CONFLICT");
    }

    const result = await sql`
      UPDATE services
      SET cleaner_id = ${cleanerId}, status = 'matched', matched_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING id, status, cleaner_id
    `;

    if (result.length === 0) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }

    await sql`
      INSERT INTO notifications (user_id, service_id, type, title, message, data)
      SELECT user_id, ${jobId}, 'service_matched', 'Cleaner Assigned',
        'A cleaner has been assigned to your service request.',
        JSONB_BUILD_OBJECT('service_id', ${jobId}, 'cleaner_id', ${cleanerId})
      FROM services WHERE id = ${jobId}
    `;

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error accepting job");
  }
}
