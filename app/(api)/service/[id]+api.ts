import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function GET(
  request: Request,
  { params }: { params?: { id?: string } } = {},
) {
  try {
    const id = params?.id;
    if (!id) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
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
      WHERE s.id = ${id};
    `;

    if (response.length === 0) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }

    return jsonResponse({ data: response[0] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching service");
  }
}
