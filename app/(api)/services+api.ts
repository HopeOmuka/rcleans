import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT
        s.id, s.service_type_id, s.user_id,
        s.location_address, s.location_lat, s.location_lng,
        s.scheduled_date, s.estimated_duration, s.actual_duration,
        s.status, s.total_price, s.payment_status, s.created_at,
        s.started_at, s.completed_at, s.discount_amount, s.promo_code_id,
        s.special_instructions, s.rating, s.review,
        s.recurrence, s.recurring_parent_id,
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
      WHERE s.user_id = ${auth.userId}
      ORDER BY s.created_at DESC
      LIMIT ${limit};
    `;

    const data = response.map((s) => ({
      ...s,
      location_lat: Number(s.location_lat),
      location_lng: Number(s.location_lng),
      estimated_duration: Number(s.estimated_duration),
      actual_duration:
        s.actual_duration === null ? null : Number(s.actual_duration),
      total_price: Number(s.total_price),
      discount_amount:
        s.discount_amount === null ? 0 : Number(s.discount_amount),
      rating: s.rating === null ? null : Number(s.rating),
      service_type: {
        ...s.service_type,
        base_price: Number(s.service_type.base_price),
        price_per_hour: Number(s.service_type.price_per_hour),
        estimated_duration_hours: Number(
          s.service_type.estimated_duration_hours,
        ),
      },
      cleaner: s.cleaner?.id
        ? {
            ...s.cleaner,
            rating: Number(s.cleaner.rating),
            completed_jobs: Number(s.cleaner.completed_jobs),
            years_experience: Number(s.cleaner.years_experience),
            location_lat: Number(s.cleaner.location_lat),
            location_lng: Number(s.cleaner.location_lng),
          }
        : s.cleaner,
    }));

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching services");
  }
}
