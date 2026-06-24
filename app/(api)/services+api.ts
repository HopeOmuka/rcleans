import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!userId) {
      throw new AppError(400, "user_id is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT
        s.id, s.service_type_id, s.user_id,
        s.location_address, s.location_lat, s.location_lng,
        s.scheduled_date, s.estimated_duration, s.actual_duration,
        s.status, s.total_price, s.payment_status, s.created_at,
        s.started_at, s.completed_at, s.discount_amount, s.promo_code_id,
        s.special_instructions, s.rating, s.review,
        json_build_object(
          'id', c.id, 'first_name', c.first_name, 'last_name', c.last_name,
          'profile_image_url', c.profile_image_url, 'rating', c.rating,
          'specialties', c.specialties, 'location_lat', c.location_lat,
          'location_lng', c.location_lng, 'is_available', c.is_available,
          'completed_jobs', c.completed_jobs, 'years_experience', c.years_experience
        ) AS cleaner,
        json_build_object(
          'id', st.id, 'name', st.name, 'description', st.description,
          'base_price', st.base_price, 'price_per_hour', st.price_per_hour,
          'estimated_duration_hours', st.estimated_duration_hours
        ) AS service_type
      FROM services s
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      INNER JOIN service_types st ON s.service_type_id = st.id
      WHERE s.user_id = ${userId}
      ORDER BY s.created_at DESC
      LIMIT ${limit};
    `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching services");
  }
}
