import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const cleanerId = searchParams.get("cleanerId");
    const serviceId = searchParams.get("serviceId");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    let query = `
      SELECT id, user_id, cleaner_id, service_id, sender_type, sender_id, 
             message, is_read, created_at
      FROM notifications
      WHERE type = 'chat_message'
      AND ((user_id = $1 AND sender_type = 'cleaner')
           OR (cleaner_id = $1 AND sender_type = 'user'))
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (cleanerId) {
      query += ` AND cleaner_id = $${paramIndex}`;
      params.push(cleanerId);
      paramIndex++;
    }

    if (serviceId) {
      query += ` AND service_id = $${paramIndex}`;
      params.push(serviceId);
    }

    query += ` ORDER BY created_at ASC`;

    const messages = await sql.bind(...params).execute(query);

    return Response.json({ data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cleanerId, serviceId, senderType, senderId, message } =
      body;

    if (!userId || !message) {
      return Response.json(
        { error: "User ID and message required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      INSERT INTO notifications (user_id, cleaner_id, service_id, type, sender_type, sender_id, title, message)
      VALUES (
        ${userId},
        ${cleanerId || null},
        ${serviceId || null},
        'chat_message',
        ${senderType || (cleanerId ? "cleaner" : "user")},
        ${senderId || userId},
        'New Message',
        ${message}
      )
      RETURNING id, user_id, cleaner_id, service_id, sender_type, sender_id, message, is_read, created_at
    `;

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("Error sending message:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
