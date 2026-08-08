import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth, rateLimit } from "@/lib/server-auth";

const ALLOWED_TYPES = [
  "service_request",
  "service_matched",
  "service_started",
  "service_completed",
  "payment_received",
  "rating_received",
  "system_message",
] as const;

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const identity = auth.kind === "user" ? auth.userId : auth.cleanerId;
    await rateLimit(`notif:post:${auth.kind}:${identity}`, 60, 60_000);

    const body = await request.json();
    const { serviceId, type, title, message, data } = body;

    if (!type || !title || !message) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }
    if (
      typeof type !== "string" ||
      !(ALLOWED_TYPES as readonly string[]).includes(type)
    ) {
      throw new AppError(400, "Invalid notification type", "VALIDATION_ERROR");
    }
    if (
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.length > 200
    ) {
      throw new AppError(400, "Invalid notification title", "VALIDATION_ERROR");
    }
    if (typeof message !== "string" || message.length > 1000) {
      throw new AppError(
        400,
        "Message too long (max 1000 chars)",
        "VALIDATION_ERROR",
      );
    }
    if (serviceId != null && typeof serviceId !== "string") {
      throw new AppError(400, "Invalid service ID", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    if (serviceId) {
      const [service] = await sql`
        SELECT user_id, cleaner_id FROM services WHERE id = ${serviceId}
      `;
      if (!service) {
        throw new AppError(404, "Service not found", "NOT_FOUND");
      }
      const isParticipant =
        auth.kind === "user"
          ? service.user_id === auth.userId
          : service.cleaner_id === auth.cleanerId;
      if (!isParticipant) {
        throw new AppError(
          403,
          "Not authorized to create notifications for this service",
          "FORBIDDEN",
        );
      }
    }

    const response = await sql`
      INSERT INTO notifications (
        user_id, cleaner_id, service_id, type, title, message, data
      )
      VALUES (
        ${auth.kind === "user" ? auth.userId : null},
        ${auth.kind === "cleaner" ? auth.cleanerId : null},
        ${serviceId || null},
        ${type}, ${title}, ${message}, ${data || null}
      )
      RETURNING *;
    `;

    return jsonResponse({ data: response[0] }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating notification");
  }
}

export async function GET(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response =
      auth.kind === "user"
        ? await sql`
          SELECT * FROM notifications
          WHERE user_id = ${auth.userId}
          ORDER BY created_at DESC
          LIMIT ${limit};
        `
        : await sql`
          SELECT * FROM notifications
          WHERE cleaner_id = ${auth.cleanerId}
          ORDER BY created_at DESC
          LIMIT ${limit};
        `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching notifications");
  }
}
