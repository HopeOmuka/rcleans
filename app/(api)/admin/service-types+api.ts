import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);
    const rows = await sql`
      SELECT id, name, description, base_price, price_per_hour,
        estimated_duration_hours, is_active, sort_order, created_at
      FROM service_types
      ORDER BY sort_order ASC, name ASC
    `;
    const data = rows.map((r) => ({
      ...r,
      base_price: Number(r.base_price),
      price_per_hour: Number(r.price_per_hour),
      estimated_duration_hours: Number(r.estimated_duration_hours),
    }));
    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching service types");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
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
      throw new AppError(400, "Invalid estimated duration", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const [row] = await sql`
      INSERT INTO service_types (id, name, description, base_price, price_per_hour, estimated_duration_hours)
      VALUES (gen_random_uuid()::text, ${name.trim()}, ${description?.trim() ?? ""}, ${price}, ${perHour}, ${duration})
      RETURNING id, name, description, base_price, price_per_hour, estimated_duration_hours, is_active
    `;
    const data = {
      ...row,
      base_price: Number(row.base_price),
      price_per_hour: Number(row.price_per_hour),
      estimated_duration_hours: Number(row.estimated_duration_hours),
    };
    return jsonResponse({ data }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating service type");
  }
}
