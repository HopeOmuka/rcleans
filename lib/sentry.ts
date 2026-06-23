import { logger } from "./logger";

type SentryLevel = "error" | "warning" | "info";

interface SentryEvent {
  message: string;
  level: SentryLevel;
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
}

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const IS_ENABLED = !!SENTRY_DSN;

async function sendToSentry(event: SentryEvent): Promise<void> {
  if (!IS_ENABLED) {
    logger.debug(`[Sentry Mock] ${event.level}: ${event.message}`, event.extra);
    return;
  }

  try {
    const body = {
      event: {
        message: event.message,
        level: event.level,
        extra: event.extra,
        tags: event.tags,
        user: event.user,
        timestamp: new Date().toISOString(),
        environment: process.env.EXPO_PUBLIC_APP_ENV || "development",
      },
    };

    await fetch(`${SENTRY_DSN}/api/1/envelope/`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error("Failed to send event to Sentry", err);
  }
}

export const monitoring = {
  captureError(error: Error, extra?: Record<string, unknown>) {
    sendToSentry({
      message: error.message,
      level: "error",
      extra: { ...extra, stack: error.stack },
      tags: { error_type: error.name },
    });
  },

  captureMessage(message: string, level: SentryLevel = "info") {
    sendToSentry({ message, level });
  },

  setUser(user: { id?: string; email?: string }) {
    logger.info(`[Sentry] User set: ${user.id || user.email}`);
  },
};
