import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT id, name, description, base_price, price_per_hour, estimated_duration_hours
      FROM service_types
      WHERE is_active = true
      ORDER BY name
    `;
    const data = response.map((st) => ({
      ...st,
      base_price: Number(st.base_price),
      price_per_hour: Number(st.price_per_hour),
      estimated_duration_hours: Number(st.estimated_duration_hours),
    }));
    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error, "Error fetching service types");
  }
}
