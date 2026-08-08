import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);

    if (auth.kind === "user") {
      await sql`
        UPDATE notifications SET is_read = true
        WHERE is_read = false AND user_id = ${auth.userId}
      `;
    } else {
      await sql`
        UPDATE notifications SET is_read = true
        WHERE is_read = false AND cleaner_id = ${auth.cleanerId}
      `;
    }

    return jsonResponse({ data: { success: true } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error marking notifications as read");
  }
}
