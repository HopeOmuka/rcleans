import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { rateLimit, requireUserAuth } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";

const SUBJECTS = ["help_center", "contact_support"] as const;
type SupportSubject = (typeof SUBJECTS)[number];

const VALID_STATUSES = ["open", "in_progress", "resolved"] as const;

function parseSubject(value: unknown): SupportSubject {
  if (typeof value === "string" && SUBJECTS.includes(value as SupportSubject)) {
    return value as SupportSubject;
  }
  throw new AppError(400, "Invalid subject", "VALIDATION_ERROR");
}

async function requireAdmin(
  request: Request,
  sql: NeonQueryFunction<false, false>,
) {
  const { userId } = await requireUserAuth(request);
  const rows = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
  if (!rows[0]?.is_admin) {
    throw new AppError(403, "Admin access required", "FORBIDDEN");
  }
  return userId;
}

export async function GET(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const admin =
        await sql`SELECT is_admin FROM users WHERE id = ${auth.userId}`;
      if (!admin[0]?.is_admin) {
        throw new AppError(403, "Admin access required", "FORBIDDEN");
      }
      const rawStatus = searchParams.get("status");
      const status =
        rawStatus && (VALID_STATUSES as readonly string[]).includes(rawStatus)
          ? rawStatus
          : null;

      const rows = status
        ? await sql`
            SELECT sm.id, sm.user_id, sm.subject, sm.message, sm.status, sm.created_at,
                   u.name AS user_name, u.email AS user_email
            FROM support_messages sm
            INNER JOIN users u ON u.id = sm.user_id
            WHERE sm.status = ${status}
            ORDER BY sm.created_at DESC
            LIMIT 200
          `
        : await sql`
            SELECT sm.id, sm.user_id, sm.subject, sm.message, sm.status, sm.created_at,
                   u.name AS user_name, u.email AS user_email
            FROM support_messages sm
            INNER JOIN users u ON u.id = sm.user_id
            ORDER BY
              CASE sm.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
              sm.created_at DESC
            LIMIT 200
          `;
      return jsonResponse({ data: rows });
    }

    const rows = await sql`
      SELECT id, subject, message, status, created_at
      FROM support_messages
      WHERE user_id = ${auth.userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return jsonResponse({ data: rows });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching support messages");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`support:${auth.userId}`, 20, 60_000);

    const body = await request.json();
    const { action } = body;

    const sql = neon(`${process.env.DATABASE_URL}`);

    if (action === "updateStatus") {
      await requireAdmin(request, sql);
      const { ticketId, status } = body;
      if (!ticketId) {
        throw new AppError(400, "Ticket ID required", "VALIDATION_ERROR");
      }
      if (!(VALID_STATUSES as readonly string[]).includes(status)) {
        throw new AppError(
          400,
          `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          "VALIDATION_ERROR",
        );
      }

      const result = await sql`
        UPDATE support_messages SET status = ${status}::text
        WHERE id = ${ticketId}::text
        RETURNING id, status
      `;
      if (result.length === 0) {
        throw new AppError(404, "Ticket not found", "NOT_FOUND");
      }

      const [ticket] = await sql`
        SELECT user_id FROM support_messages WHERE id = ${ticketId}::text
      `;
      if (ticket?.user_id) {
        await sql.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            ticket.user_id,
            "system_message",
            `Your support request is ${status}`,
            "Your ticket has been updated. Check the support section for details.",
            JSON.stringify({ ticket_id: ticketId, status }),
          ],
        );
        void sendPush({
          userId: ticket.user_id,
          title: "Support update",
          body: `Your support request is now ${status}.`,
          data: { ticket_id: ticketId },
        });
      }

      return jsonResponse({ data: result[0] });
    }

    const { subject, message } = body;
    const parsedSubject = parseSubject(subject);

    if (typeof message !== "string" || message.trim().length === 0) {
      throw new AppError(400, "Message is required", "VALIDATION_ERROR");
    }
    if (message.trim().length > 5000) {
      throw new AppError(
        400,
        "Message too long (max 5000 characters)",
        "VALIDATION_ERROR",
      );
    }

    await sql`
      INSERT INTO support_messages (user_id, subject, message)
      VALUES (${auth.userId}, ${parsedSubject}, ${message.trim()})
    `;

    return jsonResponse({ data: { success: true } }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error submitting support message");
  }
}
