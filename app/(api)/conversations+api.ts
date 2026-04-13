import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const conversations = await sql`
      WITH latest_messages AS (
        SELECT 
          n1.id,
          n1.service_id,
          n1.user_id,
          n1.cleaner_id,
          n1.message,
          n1.created_at,
          n1.is_read,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(n1.service_id, n1.id)
            ORDER BY n1.created_at DESC
          ) as rn
        FROM notifications n1
        WHERE n1.type = 'chat_message'
          AND (n1.user_id = ${userId} OR n1.cleaner_id = ${userId})
      )
      SELECT 
        lm.service_id as conversation_id,
        lm.message as last_message,
        lm.created_at as last_message_time,
        lm.is_read,
        s.service_type_id,
        st.name as service_type_name,
        CASE 
          WHEN lm.user_id = ${userId} THEN c.id
          ELSE u.id
        END as other_user_id,
        CASE 
          WHEN lm.user_id = ${userId} THEN CONCAT(c.first_name, ' ', c.last_name)
          ELSE u.name
        END as other_user_name,
        CASE 
          WHEN lm.user_id = ${userId} THEN c.profile_image_url
          ELSE u.profile_image_url
        END as other_user_avatar
      FROM latest_messages lm
      LEFT JOIN services s ON lm.service_id = s.id
      LEFT JOIN service_types st ON s.service_type_id = st.id
      LEFT JOIN cleaners c ON s.cleaner_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE lm.rn = 1
      ORDER BY lm.created_at DESC
    `;

    return Response.json({ data: conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
