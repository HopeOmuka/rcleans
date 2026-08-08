import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUserAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);
    const [row] =
      await sql`SELECT is_admin FROM users WHERE id = ${auth.userId}`;

    return jsonResponse({
      data: { is_admin: !!row?.is_admin, userId: auth.userId },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error checking admin access");
  }
}
