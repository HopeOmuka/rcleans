import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

interface StripeErrorShape {
  type: string;
  statusCode: number;
  raw?: { message?: string; code?: string; decline_code?: string };
  message?: string;
}

function isStripeCardError(error: unknown): error is StripeErrorShape {
  if (!error || typeof error !== "object") return false;
  const e = error as StripeErrorShape;
  return (
    typeof e.type === "string" &&
    e.type.startsWith("Stripe") &&
    typeof e.statusCode === "number" &&
    e.statusCode >= 400 &&
    e.statusCode < 500
  );
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(error: unknown, context?: string) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode },
    );
  }

  // Surface Stripe card/API errors (e.g. declined payments) as readable
  // 4xx responses instead of a generic 500, so clients fail fast and show
  // the real reason instead of retrying a declined charge.
  if (isStripeCardError(error)) {
    const message = error.raw?.message || error.message || "Payment error";
    const code = error.raw?.code || "STRIPE_ERROR";
    logger.warn(`${context || "API"}: ${message}`);
    return Response.json(
      {
        error: message,
        code,
        details: error.raw?.decline_code
          ? { decline_code: error.raw.decline_code }
          : undefined,
      },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(`${context || "API"}: ${message}`, error);

  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}
