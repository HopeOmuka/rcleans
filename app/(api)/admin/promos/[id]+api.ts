import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { action } = body;

    if (!id) {
      throw new AppError(400, "Promo code ID required", "VALIDATION_ERROR");
    }
    if (action !== "activate" && action !== "deactivate") {
      throw new AppError(
        400,
        "Invalid action. Must be one of: activate, deactivate",
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const result = await sql`
      UPDATE promo_codes
      SET is_active = ${action === "activate"}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, code, is_active
    `;
    if (result.length === 0) {
      throw new AppError(404, "Promo code not found", "NOT_FOUND");
    }
    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating promo code");
  }
}
