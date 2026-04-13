import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("service_id");
    const userId = url.searchParams.get("user_id");

    if (!serviceId) {
      return Response.json({ error: "service_id required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const messages = await sql`
      SELECT 
        id,
        service_id,
        sender_id,
        sender_type,
        content,
        is_read,
        created_at
      FROM messages
      WHERE service_id = ${serviceId}
      ORDER BY created_at ASC
    `;

    return Response.json({ data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      service_id,
      sender_id,
      sender_type,
      receiver_id,
      receiver_type,
      content,
    } = body;

    if (
      !service_id ||
      !sender_id ||
      !sender_type ||
      !receiver_id ||
      !receiver_type ||
      !content
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      INSERT INTO messages (service_id, sender_id, sender_type, receiver_id, receiver_type, content)
      VALUES (${service_id}, ${sender_id}, ${sender_type}, ${receiver_id}, ${receiver_type}, ${content})
      RETURNING *
    `;

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("Error sending message:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { message_id } = body;

    if (!message_id) {
      return Response.json({ error: "message_id required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    await sql`
      UPDATE messages SET is_read = true WHERE id = ${message_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error marking message read:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
