import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";

function generateToken(cleanerId: number): string {
  const timestamp = Date.now();
  const random = randomBytes(16).toString("hex");
  const raw = `${cleanerId}:${timestamp}:${random}`;
  const signature = createHash("sha256").update(raw).digest("hex");
  return Buffer.from(`${raw}:${signature}`).toString("base64url");
}

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

    const sql = neon(`${process.env.DATABASE_URL}`);

    const cleaners = await sql`
      SELECT * FROM cleaners WHERE email = ${email} AND phone = ${phone} LIMIT 1
    `;

    if (cleaners.length === 0) {
      throw new AppError(401, "Invalid credentials", "AUTH_ERROR");
    }

    const cleaner = cleaners[0];
    const token = generateToken(cleaner.id);

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
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Cleaner login error");
  }
}
