import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth } from "@/lib/server-auth";

// Lists the conversations the authenticated participant is part of:
// every active service with a matched other party, the last message,
// and the unread incoming count.
export async function GET(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);

    const isUser = auth.kind === "user";
    const selfId = isUser ? auth.userId : auth.cleanerId;
    const incomingFrom = isUser ? "cleaner" : "user";

    const otherSelect = isUser
      ? sql`
          c.id AS other_id,
          (c.first_name || ' ' || c.last_name) AS other_name,
          c.profile_image_url AS other_avatar
        `
      : sql`
          u.id AS other_id,
          u.name AS other_name,
          u.profile_image_url AS other_avatar
        `;

    const otherJoin = isUser
      ? sql`JOIN cleaners c ON c.id = s.cleaner_id`
      : sql`JOIN users u ON u.id = s.user_id`;

    const where = isUser
      ? sql`s.user_id = ${selfId} AND s.cleaner_id IS NOT NULL`
      : sql`s.cleaner_id = ${selfId}`;

    const response = await sql`
      SELECT
        s.id AS service_id,
        s.status,
        s.scheduled_date,
        st.name AS service_type_name,
        ${otherSelect},
        last_msg.content AS last_message,
        last_msg.created_at AS last_message_at,
        COALESCE(unread.unread_count, 0) AS unread_count
      FROM services s
      JOIN service_types st ON st.id = s.service_type_id
      ${otherJoin}
      LEFT JOIN LATERAL (
        SELECT content, created_at FROM messages
        WHERE service_id = s.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM messages
        WHERE service_id = s.id
          AND is_read = false
          AND sender_type = ${incomingFrom}
          AND (recipient_id IS NULL OR recipient_id = ${selfId})
      ) unread ON true
      WHERE ${where}
        AND s.status NOT IN ('requested', 'cancelled', 'refunded')
      ORDER BY COALESCE(last_msg.created_at, s.created_at) DESC;
    `;

    const data = response.map((row) => ({
      ...row,
      unread_count: Number(row.unread_count),
    }));

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching conversations");
  }
}
