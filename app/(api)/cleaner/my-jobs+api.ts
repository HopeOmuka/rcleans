import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get("cleanerId");

    if (!cleanerId) {
      return Response.json({ error: "Cleaner ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const jobs = await sql`
      SELECT 
        s.id,
        s.scheduled_date,
        s.estimated_duration,
        s.total_price,
        s.status,
        s.location_address,
        s.location_lat,
        s.location_lng,
        st.name as service_type_name,
        u.name as user_name,
        u.phone as user_phone,
        u.profile_image_url as user_avatar
      FROM services s
      JOIN service_types st ON s.service_type_id = st.id
      JOIN users u ON s.user_id = u.id
      WHERE s.cleaner_id = ${cleanerId}
        AND s.status NOT IN ('cancelled', 'refunded')
      ORDER BY 
        CASE s.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'arrived' THEN 2 
          WHEN 'matched' THEN 3 
          ELSE 4 
        END,
        s.scheduled_date ASC
    `;

    return Response.json({ data: jobs });
  } catch (error) {
    console.error("Error fetching cleaner jobs:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
