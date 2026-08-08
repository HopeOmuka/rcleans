import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);

    if (!id) {
      throw new AppError(400, "User ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT id, name, email, phone, profile_image_url,
             is_active, is_admin, created_at
      FROM users
      WHERE id = ${id}
    `;
    if (rows.length === 0) {
      throw new AppError(404, "User not found", "NOT_FOUND");
    }

    const [summary] = await sql`
      SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE status NOT IN ('cancelled', 'refunded'))::int AS active_bookings,
        COALESCE(SUM(total_price) FILTER (WHERE payment_status = 'paid'), 0)::float8 AS total_spent
      FROM services
      WHERE user_id = ${id}
    `;

    const recent = await sql`
      SELECT
        s.id, s.status, s.payment_status, s.total_price, s.created_at,
        s.scheduled_date,
        st.name AS service_type_name,
        c.first_name AS cleaner_first_name, c.last_name AS cleaner_last_name
      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      WHERE s.user_id = ${id}
      ORDER BY s.created_at DESC
      LIMIT 20
    `;

    const user = rows[0];
    return jsonResponse({
      data: {
        ...user,
        stats: {
          total_bookings: Number(summary.total_bookings),
          active_bookings: Number(summary.active_bookings),
          total_spent: Number(summary.total_spent),
        },
        recent: recent.map((r) => ({
          ...r,
          total_price: Number(r.total_price),
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching user");
  }
}

export async function POST(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { action } = body;

    if (!id) {
      throw new AppError(400, "User ID required", "VALIDATION_ERROR");
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
      UPDATE users
      SET is_active = ${action === "activate"}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, is_active, is_admin
    `;

    if (result.length === 0) {
      throw new AppError(404, "User not found", "NOT_FOUND");
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating user");
  }
}
