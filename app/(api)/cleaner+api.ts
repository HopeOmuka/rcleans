import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT
        id,
        first_name,
        last_name,
        profile_image_url,
        rating::float as rating,
        specialties,
        location_lat::float as location_lat,
        location_lng::float as location_lng,
        is_available,
        completed_jobs,
        years_experience
      FROM cleaners
      WHERE is_available = true
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching cleaners:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
