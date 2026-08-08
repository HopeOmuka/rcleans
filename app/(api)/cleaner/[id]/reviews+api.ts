import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function GET(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireUserAuth(request);

    if (!id) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [cleaner] = await sql`
      SELECT id, first_name, last_name, profile_image_url, rating,
        total_ratings, completed_jobs, years_experience, specialties,
        is_available
      FROM cleaners
      WHERE id = ${id}
    `;
    if (!cleaner) {
      throw new AppError(404, "Cleaner not found", "NOT_FOUND");
    }

    const reviews = await sql`
      SELECT sr.id, sr.rating, sr.review_text, sr.review_title,
        sr.created_at, u.name AS user_name, u.profile_image_url AS user_avatar,
        st.name AS service_type_name
      FROM service_ratings sr
      INNER JOIN users u ON u.id = sr.user_id
      INNER JOIN services s ON s.id = sr.service_id
      INNER JOIN service_types st ON st.id = s.service_type_id
      WHERE sr.cleaner_id = ${id}
      ORDER BY sr.created_at DESC
      LIMIT 100
    `;

    const data = {
      cleaner: {
        ...cleaner,
        rating: Number(cleaner.rating),
        total_ratings: Number(cleaner.total_ratings),
        completed_jobs: Number(cleaner.completed_jobs),
        years_experience: Number(cleaner.years_experience),
      },
      reviews: reviews.map((r) => ({
        ...r,
        rating: Number(r.rating),
      })),
    };

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching cleaner reviews");
  }
}
