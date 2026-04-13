import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cleanerId, isAvailable } = body;

    if (!cleanerId) {
      return Response.json({ error: "Cleaner ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      UPDATE cleaners
      SET is_available = ${isAvailable}, updated_at = NOW()
      WHERE id = ${cleanerId}
      RETURNING id, is_available
    `;

    if (result.length === 0) {
      return Response.json({ error: "Cleaner not found" }, { status: 404 });
    }

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("Error updating availability:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
