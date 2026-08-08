import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT
        COALESCE(SUM(total_price), 0) AS total_earned,
        COUNT(*) AS paid_jobs
      FROM services
      WHERE cleaner_id = ${auth.cleanerId}
        AND status = 'completed'
        AND payment_status = 'paid'
    `;

    const jobs = await sql`
      SELECT id, service_type_id, total_price, payment_status,
        scheduled_date, created_at, completed_at
      FROM services
      WHERE cleaner_id = ${auth.cleanerId}
        AND status = 'completed'
        AND payment_status = 'paid'
      ORDER BY COALESCE(completed_at, created_at) DESC
      LIMIT 100
    `;

    const typeIds = [...new Set(jobs.map((j) => j.service_type_id))];
    const types =
      typeIds.length === 0
        ? []
        : await sql`
            SELECT id, name FROM service_types
            WHERE id = ANY(${typeIds}::text[])
          `;
    const typeName = new Map(types.map((t) => [t.id, t.name]));

    const row = response[0];
    return jsonResponse({
      data: {
        total_earned: Number(row.total_earned),
        paid_jobs: Number(row.paid_jobs),
        jobs: jobs.map((j) => ({
          ...j,
          total_price: Number(j.total_price),
          service_type_name:
            typeName.get(j.service_type_id) ?? "Cleaning service",
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching earnings");
  }
}
