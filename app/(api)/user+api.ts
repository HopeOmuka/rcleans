import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerkId } = await request.json();

    if (!name || !email || !clerkId) {
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
      VALUES (${clerkId}, ${name.trim()}, ${email.trim()}, ${clerkId})
      RETURNING id, name, email, clerk_id;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error creating user");
  }
}
