import { describe, it, expect } from "vitest";
import { AppError, jsonResponse, errorResponse } from "@/lib/api-error";

describe("AppError", () => {
  it("creates error with status code and message", () => {
    const error = new AppError(400, "Bad request", "VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
    expect(error.code).toBe("VALIDATION_ERROR");
  });
});

describe("jsonResponse", () => {
  it("returns Response with JSON body", async () => {
    const res = jsonResponse({ foo: "bar" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ foo: "bar" });
  });

  it("uses custom status code", () => {
    const res = jsonResponse({}, 201);
    expect(res.status).toBe(201);
  });
});

describe("errorResponse", () => {
  it("returns error response for AppError", async () => {
    const error = new AppError(403, "Forbidden", "FORBIDDEN");
    const res = errorResponse(error);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns 500 for unknown errors", async () => {
    const res = errorResponse(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
  });
});
