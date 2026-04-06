import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cleanerId, serviceId, type, title, message, data } = body;

    if (!type || !title || !message) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!userId && !cleanerId) {
      return Response.json(
        { error: "Either userId or cleanerId is required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      INSERT INTO notifications (user_id, cleaner_id, service_id, type, title, message, data)
      VALUES (${userId || null}, ${cleanerId || null}, ${serviceId || null}, ${type}, ${title}, ${message}, ${data || null})
      RETURNING *;
    `;

    // In a real app, you'd also send push notifications here
    // For now, we'll just store in database

    return Response.json({ data: response[0] });
  } catch (error) {
    console.error("Error creating notification:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const cleanerId = searchParams.get("cleanerId");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!userId && !cleanerId) {
    return Response.json(
      { error: "Either userId or cleanerId is required" },
      { status: 400 },
    );
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT * FROM notifications
      WHERE (user_id = ${userId} OR cleaner_id = ${cleanerId})
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
