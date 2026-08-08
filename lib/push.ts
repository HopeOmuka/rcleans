import { neon } from "@neondatabase/serverless";
import { logger } from "@/lib/logger";

const PUSH_API = "https://exp.host/--/api/v2/push/send";

interface SendPushInput {
  userId?: string;
  cleanerId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Best-effort Expo push notification send. Never throws — push delivery
 * failures must not break the caller's request.
 */
export async function sendPush({
  userId,
  cleanerId,
  title,
  body,
  data,
}: SendPushInput): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const pushAccessToken = process.env.EXPO_PUSH_ACCESS_TOKEN;
  if (!databaseUrl) return;

  try {
    const sql = neon(databaseUrl);
    const rows = userId
      ? await sql`SELECT token FROM push_tokens WHERE user_id = ${userId}`
      : await sql`SELECT token FROM push_tokens WHERE cleaner_id = ${cleanerId}`;

    if (rows.length === 0) return;

    const messages = rows.map((r) => ({
      to: r.token,
      title,
      body,
      sound: "default" as const,
      ...(data ? { data } : {}),
    }));

    await fetch(PUSH_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json",
        ...(pushAccessToken
          ? { Authorization: `Bearer ${pushAccessToken}` }
          : {}),
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    logger.warn("Push notification send failed", { error: String(err) });
  }
}