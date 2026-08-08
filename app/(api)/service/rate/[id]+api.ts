import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";

export async function POST(request: Request, params: { id: string }) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`service:rate:${auth.userId}`, 30, 60_000);
    const serviceId = params.id;
    const body = await request.json();
    const { rating, review } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new AppError(
        400,
        "Invalid rating (must be 1-5)",
        "VALIDATION_ERROR",
      );
    }

    if (review !== undefined && review !== null) {
      if (typeof review !== "string" || review.length > 1000) {
        throw new AppError(
          400,
          "Review too long (max 1000 chars)",
          "VALIDATION_ERROR",
        );
      }
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT * FROM services WHERE id = ${serviceId}
    `;
    if (!service) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }
    if (service.status !== "completed") {
      throw new AppError(
        400,
        "Service must be completed before rating",
        "INVALID_STATE",
      );
    }
    if (service.user_id !== auth.userId) {
      throw new AppError(
        403,
        "Not authorized to rate this service",
        "FORBIDDEN",
      );
    }
    if (!service.cleaner_id) {
      throw new AppError(
        400,
        "Service has no assigned cleaner",
        "INVALID_STATE",
      );
    }

    const response = await sql`
      INSERT INTO service_ratings (service_id, user_id, cleaner_id, rating, review_text, review_title)
      VALUES (${serviceId}, ${auth.userId}, ${service.cleaner_id}, ${rating}, ${review || null},
        ${review ? "Service Review" : null})
      ON CONFLICT (service_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating, review_text = EXCLUDED.review_text,
        review_title = EXCLUDED.review_title, updated_at = NOW()
      RETURNING *;
    `;

    await sql`
      UPDATE services SET rating = ${rating}, review = ${review || null}
      WHERE id = ${serviceId}
    `;

    const [{ avg_rating, total_ratings }] = await sql`
      SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*)::integer as total_ratings
      FROM service_ratings WHERE cleaner_id = ${service.cleaner_id}
    `;

    await sql`
      UPDATE cleaners
      SET rating = ${avg_rating}, total_ratings = ${total_ratings}
      WHERE id = ${service.cleaner_id}
    `;

    return jsonResponse({ data: response[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating service rating");
  }
}
