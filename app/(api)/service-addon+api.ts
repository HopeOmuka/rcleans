import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT * FROM service_addons WHERE is_active = true ORDER BY sort_order
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching service add-ons:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
