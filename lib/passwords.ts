import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { AppError } from "@/lib/api-error";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(expectedHex, "hex");
  return (
    expected.length === candidate.length &&
    timingSafeEqual(candidate, expected)
  );
}

export function validatePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw new AppError(400, "Password is required", "VALIDATION_ERROR");
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      "VALIDATION_ERROR",
    );
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      400,
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
      "VALIDATION_ERROR",
    );
  }
  return value;
}