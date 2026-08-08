import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email } = await request.json();

    if (!name || !email) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      throw new AppError(400, "Invalid name", "VALIDATION_ERROR");
    }

    if (typeof email !== "string" || !email.includes("@")) {
      throw new AppError(400, "Invalid email address", "VALIDATION_ERROR");
    }

    const response = await sql`
      INSERT INTO users (id, name, email, clerk_id)
      VALUES (${auth.userId}, ${name.trim()}, ${email.trim()}, ${auth.userId})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        clerk_id = EXCLUDED.clerk_id,
        updated_at = NOW()
      RETURNING id, name, email, clerk_id;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating user");
  }
}
