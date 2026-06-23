import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email || !phone) {
      return Response.json(
        { error: "Email and phone required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const cleaners = await sql`
      SELECT * FROM cleaners WHERE email = ${email} AND phone = ${phone} LIMIT 1
    `;

    if (cleaners.length === 0) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const cleaner = cleaners[0];
    const token = Buffer.from(`${cleaner.id}:${Date.now()}`).toString("base64");

    return Response.json({
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
    console.error("Cleaner login error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
