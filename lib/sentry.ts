import * as Sentry from "@sentry/react-native";

import { logger } from "./logger";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || "development";

export function initSentry(): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    tracesSampleRate: 1.0,
  });
}

export const monitoring = {
  captureError(error: Error, extra?: Record<string, unknown>) {
    if (SENTRY_DSN) {
      Sentry.captureException(error, {
        extra,
        tags: { error_type: error.name },
      });
      return;
    }

    logger.error(error.message, { ...extra, stack: error.stack });
  },
};
