import { neon } from "@neondatabase/serverless";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const serviceId = params.id;

  try {
    const body = await request.json();
    const { rating, review, userId, cleanerId } = body;

    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: "Invalid rating" }, { status: 400 });
    }

    if (!userId || !cleanerId) {
      return Response.json(
        { error: "User ID and Cleaner ID required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Insert rating into service_ratings table
    const response = await sql`
      INSERT INTO service_ratings (service_id, user_id, cleaner_id, rating, review_text, review_title)
      VALUES (${serviceId}, ${userId}, ${cleanerId}, ${rating}, ${review}, ${review ? "Service Review" : null})
      ON CONFLICT (service_id, user_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        review_text = EXCLUDED.review_text,
        review_title = EXCLUDED.review_title,
        updated_at = NOW()
      RETURNING *;
    `;

    return Response.json({ data: response[0] });
  } catch (error) {
    console.error("Error creating service rating:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
