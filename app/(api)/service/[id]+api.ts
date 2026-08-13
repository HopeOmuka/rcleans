import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function GET(request: Request, params: { id?: string } = {}) {
  try {
    const auth = await requireUserAuth(request);
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
        s.started_at, s.completed_at, s.matched_at,
        s.discount_amount, s.promo_code_id,
        s.special_instructions, s.rating, s.review,
        s.recurrence, s.recurring_parent_id,
        pc.code AS promo_code,
        json_build_object(
          'id', c.id, 'first_name', c.first_name, 'last_name', c.last_name,
          'profile_image_url', c.profile_image_url, 'rating', c.rating,
          'specialties', c.specialties, 'location_lat', c.location_lat,
          'location_lng', c.location_lng, 'is_available', c.is_available,
          'completed_jobs', c.completed_jobs, 'years_experience', c.years_experience,
          'total_ratings', c.total_ratings
        ) AS cleaner,
        json_build_object(
          'id', st.id, 'name', st.name, 'description', st.description,
          'base_price', st.base_price, 'price_per_hour', st.price_per_hour,
          'estimated_duration_hours', st.estimated_duration_hours
        ) AS service_type,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id, 'name', a.name, 'price', a.price, 'quantity', sel.quantity
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS addons
      FROM services s
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      INNER JOIN service_types st ON s.service_type_id = st.id
      LEFT JOIN promo_codes pc ON s.promo_code_id = pc.id
      LEFT JOIN service_addon_selections sel ON sel.service_id = s.id
      LEFT JOIN service_addons a ON a.id = sel.addon_id
      WHERE s.id = ${id}
      GROUP BY s.id, c.id, st.id, pc.id
    `;

    if (response.length === 0) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }

    if (response[0].user_id !== auth.userId) {
      throw new AppError(
        403,
        "Not authorized to view this service",
        "FORBIDDEN",
      );
    }

    const raw = response[0];
    const data = {
      ...raw,
      location_lat: Number(raw.location_lat),
      location_lng: Number(raw.location_lng),
      estimated_duration: Number(raw.estimated_duration),
      actual_duration:
        raw.actual_duration === null ? null : Number(raw.actual_duration),
      total_price: Number(raw.total_price),
      discount_amount:
        raw.discount_amount === null ? 0 : Number(raw.discount_amount),
      rating: raw.rating === null ? null : Number(raw.rating),
      service_type: {
        ...raw.service_type,
        base_price: Number(raw.service_type.base_price),
        price_per_hour: Number(raw.service_type.price_per_hour),
        estimated_duration_hours: Number(
          raw.service_type.estimated_duration_hours,
        ),
      },
      cleaner: raw.cleaner?.id
        ? {
            ...raw.cleaner,
            rating: Number(raw.cleaner.rating),
            completed_jobs: Number(raw.cleaner.completed_jobs),
            years_experience: Number(raw.cleaner.years_experience),
            location_lat: Number(raw.cleaner.location_lat),
            location_lng: Number(raw.cleaner.location_lng),
          }
        : raw.cleaner,
      addons: (raw.addons ?? []).map(
        (a: { price: string; quantity: string }) => ({
          ...a,
          price: Number(a.price),
          quantity: Number(a.quantity),
        }),
      ),
    };

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching service");
  }
}
