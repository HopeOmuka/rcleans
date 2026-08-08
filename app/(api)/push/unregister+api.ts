import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      throw new AppError(400, "Push token is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const [row] =
      auth.kind === "user"
        ? await sql`
            DELETE FROM push_tokens
            WHERE token = ${token.trim()} AND user_id = ${auth.userId}
            RETURNING token
          `
        : await sql`
            DELETE FROM push_tokens
            WHERE token = ${token.trim()} AND cleaner_id = ${auth.cleanerId}
            RETURNING token
          `;

    return jsonResponse({ data: { removed: row?.token != null } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error unregistering push token");
  }
}
