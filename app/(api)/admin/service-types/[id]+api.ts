import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { action } = body;

    if (!id) {
      throw new AppError(400, "Service type ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    let result;

    if (action === "update") {
      const {
        name,
        description,
        base_price,
        price_per_hour,
        estimated_duration_hours,
      } = body;
      if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(400, "Name is required", "VALIDATION_ERROR");
      }
      const price = Number(base_price);
      const perHour = Number(price_per_hour);
      const duration = Number(estimated_duration_hours);
      if (isNaN(price) || price < 0 || isNaN(perHour) || perHour < 0) {
        throw new AppError(400, "Invalid prices", "VALIDATION_ERROR");
      }
      if (isNaN(duration) || duration <= 0) {
        throw new AppError(
          400,
          "Invalid estimated duration",
          "VALIDATION_ERROR",
        );
      }
      result = await sql`
        UPDATE service_types
        SET name = ${name.trim()}, description = ${description?.trim() ?? ""},
            base_price = ${price}, price_per_hour = ${perHour},
            estimated_duration_hours = ${duration}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, description, base_price, price_per_hour, estimated_duration_hours, is_active
      `;
    } else if (action === "activate" || action === "deactivate") {
      result = await sql`
        UPDATE service_types
        SET is_active = ${action === "activate"}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, description, base_price, price_per_hour, estimated_duration_hours, is_active
      `;
    } else {
      throw new AppError(
        400,
        "Invalid action. Must be one of: activate, deactivate, update",
        "VALIDATION_ERROR",
      );
    }

    if (result.length === 0) {
      throw new AppError(404, "Service type not found", "NOT_FOUND");
    }

    const data = {
      ...result[0],
      base_price: Number(result[0].base_price),
      price_per_hour: Number(result[0].price_per_hour),
      estimated_duration_hours: Number(result[0].estimated_duration_hours),
    };
    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating service type");
  }
}
