import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT
        id, first_name, last_name, profile_image_url,
        rating, specialties, location_lat, location_lng,
        is_available, completed_jobs, years_experience
      FROM cleaners
      WHERE is_available = true
    `;
    return jsonResponse({ data: response });
  } catch (error) {
    return errorResponse(error, "Error fetching cleaners");
  }
}
