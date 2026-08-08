import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

function parseScope(serviceTypeIds: unknown): string[] {
  if (serviceTypeIds == null) return [];
  if (
    !Array.isArray(serviceTypeIds) ||
    serviceTypeIds.some((s) => typeof s !== "string")
  ) {
    throw new AppError(
      400,
      "service_type_ids must be an array of service type ids",
      "VALIDATION_ERROR",
    );
  }
  return serviceTypeIds.filter((s) => s.length > 0);
}

export async function POST(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { action } = body;

    if (!id) {
      throw new AppError(400, "Addon ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    let result;

    if (action === "update") {
      const { name, description, price, estimated_duration_minutes } = body;
      if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(400, "Name is required", "VALIDATION_ERROR");
      }
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new AppError(400, "Invalid price", "VALIDATION_ERROR");
      }
      const parsedDuration = Number(estimated_duration_minutes ?? 0);
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        throw new AppError(400, "Invalid duration", "VALIDATION_ERROR");
      }
      const serviceTypeIds =
        body.service_type_ids != null
          ? parseScope(body.service_type_ids)
          : undefined;
      if (serviceTypeIds !== undefined) {
        result = await sql`
          UPDATE service_addons
          SET name = ${name.trim()}, description = ${description?.trim() ?? ""},
              price = ${parsedPrice}, estimated_duration_minutes = ${parsedDuration},
              service_type_ids = ${serviceTypeIds}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, name, description, price, estimated_duration_minutes, service_type_ids, is_active
        `;
      } else {
        result = await sql`
          UPDATE service_addons
          SET name = ${name.trim()}, description = ${description?.trim() ?? ""},
              price = ${parsedPrice}, estimated_duration_minutes = ${parsedDuration},
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, name, description, price, estimated_duration_minutes, service_type_ids, is_active
        `;
      }
    } else if (action === "activate" || action === "deactivate") {
      result = await sql`
        UPDATE service_addons
        SET is_active = ${action === "activate"}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, description, price, estimated_duration_minutes, is_active
      `;
    } else {
      throw new AppError(
        400,
        "Invalid action. Must be one of: activate, deactivate, update",
        "VALIDATION_ERROR",
      );
    }

    if (result.length === 0) {
      throw new AppError(404, "Addon not found", "NOT_FOUND");
    }

    const data = {
      ...result[0],
      price: Number(result[0].price),
      estimated_duration_minutes: Number(result[0].estimated_duration_minutes),
    };
    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating addon");
  }
}
