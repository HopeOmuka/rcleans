import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { rateLimit, clientIp, issueCleanerToken } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email || !phone) {
      throw new AppError(400, "Email and phone required", "VALIDATION_ERROR");
    }

    if (typeof email !== "string" || !email.includes("@")) {
      throw new AppError(400, "Invalid email format", "VALIDATION_ERROR");
    }

    if (typeof phone !== "string" || phone.trim().length < 7) {
      throw new AppError(400, "Invalid phone format", "VALIDATION_ERROR");
    }

    // IP limits alone can be evaded by rotating X-Forwarded-For; the
    // per-account limit is the one that stops credential brute-forcing.
    await rateLimit(`cleaner:login:ip:${clientIp(request)}`, 5, 60_000);
    await rateLimit(
      `cleaner:login:email:${email.trim().toLowerCase()}`,
      5,
      60_000,
    );

    const sql = neon(`${process.env.DATABASE_URL}`);

    const cleaners = await sql`
      SELECT * FROM cleaners
      WHERE email = ${email.trim().toLowerCase()}
        AND phone = ${phone.trim()}
      LIMIT 1
    `;

    if (cleaners.length === 0) {
      throw new AppError(401, "Invalid credentials", "AUTH_ERROR");
    }

    const cleaner = cleaners[0];
    const token = await issueCleanerToken({
      id: String(cleaner.id),
      email: cleaner.email,
      phone: cleaner.phone,
    });

    return jsonResponse({
      data: {
        cleaner: {
          id: cleaner.id,
          first_name: cleaner.first_name,
          last_name: cleaner.last_name,
          email: cleaner.email,
          phone: cleaner.phone,
          profile_image_url: cleaner.profile_image_url,
          rating: cleaner.rating,
          is_available: cleaner.is_available,
          completed_jobs: cleaner.completed_jobs,
          specialties: cleaner.specialties,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Cleaner login error");
  }
}
