import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT id, name, email, phone, is_active, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 200
    `;

    return jsonResponse({ data: rows });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching users");
  }
}
