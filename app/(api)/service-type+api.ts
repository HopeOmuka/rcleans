import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`SELECT * FROM service_types ORDER BY name`;
    return jsonResponse({ data: response });
  } catch (error) {
    return errorResponse(error, "Error fetching service types");
  }
}
