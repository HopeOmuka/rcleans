import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { hashPassword, validatePassword } from "@/lib/passwords";
import { rateLimit, clientIp } from "@/lib/server-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One-time onboarding for cleaners created before passwords existed:
// proving email + phone (the previous credential pair) sets a password.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, password } = body;

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      throw new AppError(400, "Invalid email format", "VALIDATION_ERROR");
    }

    const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (digits.length < 7 || digits.length > 15) {
      throw new AppError(400, "Invalid phone number", "VALIDATION_ERROR");
    }

    const passwordValue = validatePassword(password);

    await rateLimit(`cleaner:setpwd:ip:${clientIp(request)}`, 5, 60_000);
    await rateLimit(
      `cleaner:setpwd:email:${email.trim().toLowerCase()}`,
      5,
      60_000,
    );

    const sql = neon(`${process.env.DATABASE_URL}`);

    const cleaners = await sql`
      SELECT id, password_hash FROM cleaners
      WHERE email = ${email.trim().toLowerCase()}
        AND phone = ${phone.trim()}
      LIMIT 1
    `;
    if (cleaners.length === 0) {
      throw new AppError(401, "Invalid credentials", "AUTH_ERROR");
    }

    const cleaner = cleaners[0];
    if (cleaner.password_hash) {
      throw new AppError(
        409,
        "A password has already been set for this account",
        "PASSWORD_ALREADY_SET",
      );
    }

    await sql`
      UPDATE cleaners SET password_hash = ${hashPassword(passwordValue)}
      WHERE id = ${cleaner.id}
    `;

    return jsonResponse({ data: { success: true } }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Set password error");
  }
}
