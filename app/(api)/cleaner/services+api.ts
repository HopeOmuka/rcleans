import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cleanerId = url.searchParams.get("cleaner_id");
    const status = url.searchParams.get("status");

    if (!cleanerId) {
      return Response.json({ error: "cleaner_id required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    let query = `
      SELECT
        s.id,
        s.service_type_id,
        s.location_address,
        s.location_lat,
        s.location_lng,
        s.scheduled_date,
        s.estimated_duration,
        s.status,
        s.total_price,
        s.payment_status,
        s.created_at,
        s.started_at,
        s.completed_at,
        
        json_build_object(
          'id', st.id,
          'name', st.name,
          'description', st.description
        ) AS service_type,

        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'phone', u.phone
        ) AS user

      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.cleaner_id = ${cleanerId}
    `;

    if (status) {
      query += ` AND s.status = '${status}'`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const services = await sql`${query}`;

    return Response.json({ data: services });
  } catch (error) {
    console.error("Error fetching cleaner services:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
