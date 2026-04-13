import { neon } from "@neondatabase/serverless";

export async function GET(
  request: Request,
  { params }: { params?: { id?: string } } = {},
) {
  const id = params?.id ? decodeURIComponent(params.id) : null;

  if (!id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT
        s.id,
        s.service_type_id,
        s.location_address,
        s.location_lat,
        s.location_lng,
        s.scheduled_date,
        s.estimated_duration,
        s.actual_duration,
        s.status,
        s.total_price,
        s.payment_status,
        s.created_at,
        s.started_at,
        s.completed_at,
        s.rating,
        s.review,

        json_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'profile_image_url', c.profile_image_url,
          'rating', c.rating,
          'specialties', c.specialties,
          'location_lat', c.location_lat,
          'location_lng', c.location_lng,
          'is_available', c.is_available,
          'completed_jobs', c.completed_jobs,
          'years_experience', c.years_experience
        ) AS cleaner,

        json_build_object(
          'id', st.id,
          'name', st.name,
          'description', st.description,
          'base_price', st.base_price,
          'price_per_hour', st.price_per_hour,
          'estimated_duration_hours', st.estimated_duration_hours
        ) AS service_type

      FROM services s
      INNER JOIN cleaners c 
        ON s.cleaner_id = c.id
      INNER JOIN service_types st
        ON s.service_type_id = st.id

      WHERE s.user_id = ${id}
      ORDER BY s.created_at DESC;
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching recent service:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
