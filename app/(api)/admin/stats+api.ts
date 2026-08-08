import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [row] = await sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM cleaners) AS total_cleaners,
        (SELECT COUNT(*) FROM cleaners WHERE is_available = true) AS available_cleaners,
        (SELECT COUNT(*) FROM cleaners WHERE is_active = true) AS active_cleaners,
        (SELECT COUNT(*) FROM services) AS total_services,
        (SELECT COUNT(*) FROM services WHERE status = 'requested') AS pending_services,
        (SELECT COUNT(*) FROM services WHERE status = 'matched') AS matched_services,
        (SELECT COUNT(*) FROM services WHERE status = 'in_progress') AS in_progress_services,
        (SELECT COUNT(*) FROM services WHERE status = 'completed') AS completed_services,
        (SELECT COUNT(*) FROM services WHERE status = 'cancelled' OR status = 'refunded') AS cancelled_services,
        (SELECT COALESCE(SUM(total_price), 0) FROM services WHERE payment_status = 'paid') AS revenue,
        (SELECT COALESCE(AVG(rating), 0) FROM services WHERE rating IS NOT NULL) AS avg_rating,
        (SELECT COUNT(*) FROM support_messages WHERE status = 'open') AS open_support
    `;

    const data = row
      ? {
          total_users: Number(row.total_users),
          total_cleaners: Number(row.total_cleaners),
          available_cleaners: Number(row.available_cleaners),
          active_cleaners: Number(row.active_cleaners),
          total_services: Number(row.total_services),
          pending_services: Number(row.pending_services),
          matched_services: Number(row.matched_services),
          in_progress_services: Number(row.in_progress_services),
          completed_services: Number(row.completed_services),
          cancelled_services: Number(row.cancelled_services),
          revenue: Number(row.revenue),
          avg_rating: Number(row.avg_rating),
          open_support: Number(row.open_support),
        }
      : null;

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching admin stats");
  }
}
