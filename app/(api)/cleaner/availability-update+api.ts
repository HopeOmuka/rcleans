import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);
    const body = await request.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== "boolean") {
      throw new AppError(
        400,
        "isAvailable must be a boolean",
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      UPDATE cleaners
      SET is_available = ${isAvailable}, updated_at = NOW()
      WHERE id = ${auth.cleanerId}
      RETURNING id, is_available
    `;

    if (result.length === 0) {
      throw new AppError(404, "Cleaner not found", "NOT_FOUND");
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating availability");
  }
}
