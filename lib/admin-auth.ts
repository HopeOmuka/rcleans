import { neon } from "@neondatabase/serverless";
import { AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function requireAdminAuth(request: Request) {
  const auth = await requireUserAuth(request);

  const sql = neon(`${process.env.DATABASE_URL}`);
  const [row] = await sql`SELECT is_admin FROM users WHERE id = ${auth.userId}`;

  if (!row?.is_admin) {
    throw new AppError(403, "Admin access required", "FORBIDDEN");
  }

  return auth;
}
