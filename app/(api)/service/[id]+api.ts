import { neon } from "@neondatabase/serverless";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  if (!id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT
        s.service_id,
        s.origin_address,
        s.destination_address,
        s.origin_latitude,
        s.origin_longitude,
        s.destination_latitude,
        s.destination_longitude,
        s.service_time,
        s.fare_price,
        s.payment_status,
        s.created_at,

        json_build_object(
          'cleaner_id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'profile_image_url', c.profile_image_url,
          'car_image_url', c.car_image_url,
          'car_seats', c.car_seats,
          'rating', c.rating
        ) AS cleaner

      FROM services s
      INNER JOIN cleaners c 
        ON s.cleaner_id = c.id

      WHERE s.user_id = ${id}
      ORDER BY s.created_at DESC;
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching recent service:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
