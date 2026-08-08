import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const body = await request.json();
    const { token, platform } = body;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      throw new AppError(400, "Push token required", "VALIDATION_ERROR");
    }
    if (token.length > 200) {
      throw new AppError(400, "Invalid push token", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const [row] = await sql`
      INSERT INTO push_tokens (user_id, cleaner_id, token, platform)
      VALUES (
        ${auth.kind === "user" ? auth.userId : null},
        ${auth.kind === "cleaner" ? auth.cleanerId : null},
        ${token.trim()},
        ${typeof platform === "string" ? platform.slice(0, 20) : "unknown"}
      )
      ON CONFLICT (token) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        cleaner_id = EXCLUDED.cleaner_id,
        platform = EXCLUDED.platform,
        updated_at = NOW()
      RETURNING token
    `;

    return jsonResponse({ data: { token: row.token } }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error registering push token");
  }
}
