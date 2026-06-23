import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cleanerId, serviceId, type, title, message, data } = body;

    if (!type || !title || !message) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    if (!userId && !cleanerId) {
      throw new AppError(400, "Either userId or cleanerId is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      INSERT INTO notifications (user_id, cleaner_id, service_id, type, title, message, data)
      VALUES (${userId || null}, ${cleanerId || null}, ${serviceId || null},
        ${type}, ${title}, ${message}, ${data || null})
      RETURNING *;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error creating notification");
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const cleanerId = searchParams.get("cleanerId");
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

    if (!userId && !cleanerId) {
      throw new AppError(400, "Either userId or cleanerId is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      SELECT * FROM notifications
      WHERE ${userId ? sql`user_id = ${userId}` : sql`cleaner_id = ${cleanerId}`}
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching notifications");
  }
}
