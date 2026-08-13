import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { hashPassword, validatePassword } from "@/lib/passwords";
import { rateLimit, clientIp } from "@/lib/server-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      specialties,
      years_experience,
      bio,
    } = body ?? {};

    const passwordValue = validatePassword(password);

    if (
      typeof first_name !== "string" ||
      first_name.trim().length < 2 ||
      typeof last_name !== "string" ||
      last_name.trim().length < 2
    ) {
      throw new AppError(
        400,
        "First and last name must each be at least 2 characters",
        "VALIDATION_ERROR",
      );
    }

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      throw new AppError(400, "Invalid email format", "VALIDATION_ERROR");
    }

    const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if (digits.length < 7 || digits.length > 15) {
      throw new AppError(400, "Invalid phone number", "VALIDATION_ERROR");
    }

    if (
      !Array.isArray(specialties) ||
      specialties.length === 0 ||
      specialties.some((s) => typeof s !== "string")
    ) {
      throw new AppError(
        400,
        "Select at least one service specialty",
        "VALIDATION_ERROR",
      );
    }

    const years = Number(years_experience);
    if (
      !Number.isFinite(years) ||
      years < 0 ||
      years > 50 ||
      !Number.isInteger(years)
    ) {
      throw new AppError(
        400,
        "Years of experience must be a whole number between 0 and 50",
        "VALIDATION_ERROR",
      );
    }

    await rateLimit(`cleaner:register:ip:${clientIp(request)}`, 3, 60_000);
    await rateLimit(
      `cleaner:register:email:${email.trim().toLowerCase()}`,
      3,
      60_000,
    );

    const sql = neon(`${process.env.DATABASE_URL}`);

    const existing = await sql`
      SELECT id FROM cleaners
      WHERE email = ${email.trim().toLowerCase()} OR phone = ${phone.trim()}
      LIMIT 1
    `;
    if (existing.length > 0) {
      throw new AppError(
        409,
        "A cleaner with this email or phone already exists",
        "CONFLICT",
      );
    }

    const inserted = await sql`
      INSERT INTO cleaners (
        first_name, last_name, email, phone, password_hash,
        specialties, years_experience, bio,
        is_available, is_active,
        background_check_status, insurance_status
      ) VALUES (
        ${first_name.trim()}, ${last_name.trim()}, ${email.trim().toLowerCase()}, ${phone.trim()},
        ${hashPassword(passwordValue)}, ${specialties}, ${years}, ${typeof bio === "string" ? bio.trim() : null},
        true, false,
        'pending', 'pending'
      )
      RETURNING id, email
    `;

    return jsonResponse({
      data: {
        id: inserted[0].id,
        email: inserted[0].email,
        status: "pending",
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Registration error");
  }
}
