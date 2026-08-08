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

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);
    const rows = await sql`
      SELECT id, name, description, price, estimated_duration_minutes,
        service_type_ids, is_active, sort_order, created_at
      FROM service_addons
      ORDER BY sort_order ASC, name ASC
    `;
    const data = rows.map((r) => ({
      ...r,
      price: Number(r.price),
      estimated_duration_minutes: Number(r.estimated_duration_minutes),
    }));
    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching addons");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { name, description, price, estimated_duration_minutes } = body;
    const serviceTypeIds = parseScope(body.service_type_ids);

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

    const sql = neon(`${process.env.DATABASE_URL}`);
    const [row] = await sql`
      INSERT INTO service_addons (name, description, price, estimated_duration_minutes, service_type_ids)
      VALUES (${name.trim()}, ${description?.trim() ?? ""}, ${parsedPrice}, ${parsedDuration}, ${serviceTypeIds})
      RETURNING id, name, description, price, estimated_duration_minutes, service_type_ids, is_active
    `;
    const data = {
      ...row,
      price: Number(row.price),
      estimated_duration_minutes: Number(row.estimated_duration_minutes),
    };
    return jsonResponse({ data }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating addon");
  }
}
