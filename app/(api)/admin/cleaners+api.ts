import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT
        id, first_name, last_name, email, phone,
        rating, completed_jobs, years_experience,
        is_available, is_active, background_check_status, insurance_status,
        created_at
      FROM cleaners
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const data = rows.map((r) => ({
      ...r,
      rating: Number(r.rating),
      completed_jobs: Number(r.completed_jobs),
    }));

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching cleaners");
  }
}
