import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth, rateLimit } from "@/lib/server-auth";

async function assertParticipant(
  sql: NeonQueryFunction<false, false>,
  serviceId: string,
  auth:
    | { kind: "user"; userId: string }
    | { kind: "cleaner"; cleanerId: string },
) {
  const [service] = await sql`
    SELECT id, user_id, cleaner_id FROM services WHERE id = ${serviceId}
  `;
  if (!service) {
    throw new AppError(404, "Service not found", "NOT_FOUND");
  }
  const isUser = auth.kind === "user" && service.user_id === auth.userId;
  const isCleaner =
    auth.kind === "cleaner" && service.cleaner_id === auth.cleanerId;
  if (!isUser && !isCleaner) {
    throw new AppError(
      403,
      "Not authorized to access this conversation",
      "FORBIDDEN",
    );
  }
  return service;
}

export async function GET(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const offset = isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

    if (!serviceId) {
      throw new AppError(400, "serviceId is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    await assertParticipant(sql, serviceId, auth);

    const selfId = auth.kind === "user" ? auth.userId : auth.cleanerId;
    const selfType = auth.kind === "user" ? "user" : "cleaner";

    const response = await sql`
      SELECT * FROM messages
      WHERE service_id = ${serviceId}
        AND (sender_id = ${selfId} OR recipient_id = ${selfId}
          OR sender_type = ${selfType})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching messages");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    await rateLimit(
      `chat:post:${auth.kind}:${auth.kind === "user" ? auth.userId : auth.cleanerId}`,
      120,
      60_000,
    );

    const body = await request.json();
    const { serviceId, recipientId, content } = body;

    if (!serviceId || !content) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AppError(
        400,
        "Message content cannot be empty",
        "VALIDATION_ERROR",
      );
    }

    if (content.length > 5000) {
      throw new AppError(
        400,
        "Message too long (max 5000 chars)",
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    await assertParticipant(sql, serviceId, auth);

    const senderId = auth.kind === "user" ? auth.userId : auth.cleanerId;
    const senderType = auth.kind === "user" ? "user" : "cleaner";

    const response = await sql`
      INSERT INTO messages (service_id, sender_id, sender_type, recipient_id, content)
      VALUES (${serviceId}, ${senderId}, ${senderType}, ${recipientId || null}, ${content.trim()})
      RETURNING *;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error sending message");
  }
}
