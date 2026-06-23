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

  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(`${context || "API"}: ${message}`, error);

  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}
