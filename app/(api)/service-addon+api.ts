import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const serviceTypeId = url.searchParams.get("service_type_id");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT id, name, description, price, estimated_duration_minutes,
        is_active, sort_order, service_type_ids
      FROM service_addons
      WHERE is_active = true
        AND (
          COALESCE(CARDINALITY(service_type_ids), 0) = 0
          OR ${serviceTypeId ?? ""} = ANY(service_type_ids)
        )
      ORDER BY sort_order
    `;
    const data = response.map((addon) => ({
      ...addon,
      price: Number(addon.price),
      estimated_duration_minutes: Number(addon.estimated_duration_minutes),
    }));
    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error, "Error fetching service add-ons");
  }
}
