import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const cleanerId = searchParams.get("cleanerId");
    const serviceId = searchParams.get("serviceId");
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const offset = isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

    if (!userId && !cleanerId) {
      throw new AppError(400, "Either userId or cleanerId is required", "VALIDATION_ERROR");
    }

    if (!serviceId) {
      throw new AppError(400, "serviceId is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    let response;
    if (userId && cleanerId) {
      response = await sql`
        SELECT * FROM messages
        WHERE service_id = ${serviceId}
          AND ((sender_id = ${userId} AND sender_type = 'user')
            OR (sender_id = ${cleanerId} AND sender_type = 'cleaner'))
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    } else if (userId) {
      response = await sql`
        SELECT * FROM messages
        WHERE service_id = ${serviceId}
          AND (sender_id = ${userId} OR recipient_id = ${userId})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    } else {
      response = await sql`
        SELECT * FROM messages
        WHERE service_id = ${serviceId}
          AND (sender_id = ${cleanerId} OR recipient_id = ${cleanerId})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    }

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching messages");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, senderId, senderType, recipientId, content } = body;

    if (!serviceId || !senderId || !senderType || !content) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AppError(400, "Message content cannot be empty", "VALIDATION_ERROR");
    }

    if (content.length > 5000) {
      throw new AppError(400, "Message too long (max 5000 chars)", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      INSERT INTO messages (service_id, sender_id, sender_type, recipient_id, content)
      VALUES (${serviceId}, ${senderId}, ${senderType}, ${recipientId || null}, ${content.trim()})
      RETURNING *;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error sending message");
  }
}
