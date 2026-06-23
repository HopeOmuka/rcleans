import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cleanerId, isAvailable } = body;

    if (!cleanerId) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      UPDATE cleaners
      SET is_available = ${isAvailable}, updated_at = NOW()
      WHERE id = ${cleanerId}
      RETURNING id, is_available
    `;

    if (result.length === 0) {
      throw new AppError(404, "Cleaner not found", "NOT_FOUND");
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error updating availability");
  }
}
