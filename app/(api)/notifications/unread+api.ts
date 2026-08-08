import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);

    const [row] =
      auth.kind === "user"
        ? await sql`
            SELECT COUNT(*)::int AS count
            FROM notifications
            WHERE is_read = false AND user_id = ${auth.userId}
          `
        : await sql`
            SELECT COUNT(*)::int AS count
            FROM notifications
            WHERE is_read = false AND cleaner_id = ${auth.cleanerId}
          `;

    return jsonResponse({ data: { count: row?.count ?? 0 } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching unread count");
  }
}
