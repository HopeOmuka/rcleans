import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth, rateLimit } from "@/lib/server-auth";

// Marks all incoming messages in a conversation as read for the
// authenticated participant.
export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const identity = auth.kind === "user" ? auth.userId : auth.cleanerId;
    await rateLimit(`chat:read:${auth.kind}:${identity}`, 120, 60_000);

    const body = await request.json();
    const { serviceId } = body;

    if (typeof serviceId !== "string" || serviceId.trim().length === 0) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const selfId = auth.kind === "user" ? auth.userId : auth.cleanerId;

    await sql`
      UPDATE messages
      SET is_read = true
      WHERE service_id = ${serviceId}
        AND is_read = false
        AND (
          recipient_id = ${selfId}
          OR (recipient_id IS NULL AND sender_type <> ${auth.kind})
        );
    `;

    return jsonResponse({ data: { success: true } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error marking messages as read");
  }
}
