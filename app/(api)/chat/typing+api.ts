import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { resolveAuth, rateLimit } from "@/lib/server-auth";

// "Is typing" is an ephemeral presence signal: the poster stamps a
// timestamp, and GET only reports it while it is fresh.
const TYPING_TTL_MS = 10_000;

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

export async function POST(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const identity = auth.kind === "user" ? auth.userId : auth.cleanerId;
    await rateLimit(`chat:typing:${auth.kind}:${identity}`, 60, 60_000);

    const body = await request.json();
    const { serviceId } = body;
    if (typeof serviceId !== "string" || serviceId.trim().length === 0) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    await assertParticipant(sql, serviceId, auth);

    const senderType = auth.kind === "user" ? "user" : "cleaner";

    await sql`
      INSERT INTO chat_typing (service_id, sender_type, updated_at)
      VALUES (${serviceId}, ${senderType}, NOW())
      ON CONFLICT (service_id, sender_type)
      DO UPDATE SET updated_at = NOW()
    `;

    return jsonResponse({ data: { success: true } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating typing state");
  }
}

export async function GET(request: Request) {
  try {
    const auth = await resolveAuth(request);
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    if (!serviceId) {
      throw new AppError(400, "Service ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    await assertParticipant(sql, serviceId, auth);

    const response = await sql`
      SELECT sender_type, updated_at
      FROM chat_typing
      WHERE service_id = ${serviceId}
        AND updated_at > NOW() - make_interval(secs => ${TYPING_TTL_MS / 1000})
    `;

    return jsonResponse({
      data: {
        typing: response.map((row) => row.sender_type),
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching typing state");
  }
}
