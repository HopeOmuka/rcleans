import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get("cleanerId");

    if (!cleanerId) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const jobs = await sql`
      SELECT
        s.id, s.scheduled_date, s.estimated_duration, s.total_price,
        s.status, s.location_address,
        st.name as service_type_name,
        u.name as user_name, u.phone as user_phone,
        u.profile_image_url as user_avatar
      FROM services s
      JOIN service_types st ON s.service_type_id = st.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      WHERE s.status IN ('requested', 'matched')
        AND (s.cleaner_id IS NULL OR s.cleaner_id = ${cleanerId})
        AND s.scheduled_date >= NOW() - INTERVAL '24 hours'
      ORDER BY s.scheduled_date
    `;

    return jsonResponse({ data: jobs });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching available jobs");
  }
}
