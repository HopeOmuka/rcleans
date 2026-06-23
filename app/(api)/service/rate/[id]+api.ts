import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const serviceId = params.id;
    const body = await request.json();
    const { rating, review, userId, cleanerId } = body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError(400, "Invalid rating (must be 1-5)", "VALIDATION_ERROR");
    }

    if (!userId || !cleanerId) {
      throw new AppError(400, "User ID and Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const [service] = await sql`
      SELECT * FROM services WHERE id = ${serviceId}
    `;
    if (!service) {
      throw new AppError(404, "Service not found", "NOT_FOUND");
    }
    if (service.status !== "completed") {
      throw new AppError(400, "Service must be completed before rating", "INVALID_STATE");
    }
    if (service.user_id !== userId) {
      throw new AppError(403, "Not authorized to rate this service", "FORBIDDEN");
    }

    const response = await sql`
      INSERT INTO service_ratings (service_id, user_id, cleaner_id, rating, review_text, review_title)
      VALUES (${serviceId}, ${userId}, ${cleanerId}, ${rating}, ${review || null},
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
      FROM service_ratings WHERE cleaner_id = ${cleanerId}
    `;

    await sql`
      UPDATE cleaners
      SET rating = ${avg_rating}, total_ratings = ${total_ratings}
      WHERE id = ${cleanerId}
    `;

    return jsonResponse({ data: response[0] });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error creating service rating");
  }
}
