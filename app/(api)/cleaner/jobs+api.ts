import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const jobs = await sql`
      SELECT
        s.id, s.scheduled_date, s.estimated_duration, s.total_price,
        s.status, s.location_address,
        st.name as service_type_name,
        u.name as user_name,
        CASE WHEN s.cleaner_id = ${auth.cleanerId}
          THEN u.phone ELSE NULL END AS user_phone,
        u.profile_image_url as user_avatar
      FROM services s
      JOIN service_types st ON s.service_type_id = st.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      WHERE s.status = 'requested'
        AND (s.cleaner_id IS NULL OR s.cleaner_id = ${auth.cleanerId})
        AND s.scheduled_date >= NOW() - INTERVAL '24 hours'
      ORDER BY s.scheduled_date
    `;

    return jsonResponse({ data: jobs });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching available jobs");
  }
}
