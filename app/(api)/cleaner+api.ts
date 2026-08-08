import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`cleaners:list:${auth.userId}`, 60, 60_000);

    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT
        id, first_name, last_name, profile_image_url,
        rating, specialties, location_lat, location_lng,
        is_available, completed_jobs, years_experience, total_ratings
      FROM cleaners
      WHERE is_available = true
    `;
    const data = response.map((c) => ({
      ...c,
      rating: Number(c.rating),
      total_ratings: Number(c.total_ratings),
      completed_jobs: Number(c.completed_jobs),
      years_experience: Number(c.years_experience),
      location_lat: Number(c.location_lat),
      location_lng: Number(c.location_lng),
    }));
    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error, "Error fetching cleaners");
  }
}
