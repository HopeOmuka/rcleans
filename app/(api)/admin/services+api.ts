import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT
        s.id, s.status, s.total_price, s.payment_status,
        s.created_at, s.scheduled_date,
        st.name AS service_type_name,
        u.name AS user_name, u.email AS user_email,
        c.first_name AS cleaner_first_name, c.last_name AS cleaner_last_name
      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 200
    `;

    const data = rows.map((r) => ({
      ...r,
      total_price: Number(r.total_price),
    }));

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching bookings");
  }
}
