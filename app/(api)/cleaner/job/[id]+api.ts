import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";

export async function GET(request: Request, { id }: { id?: string } = {}) {
  try {
    const auth = await requireCleanerAuth(request);
    if (!id) {
      throw new AppError(400, "Job ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // A job is visible to a cleaner when it is still available (requested
    // and unassigned) or already assigned to them.
    const response = await sql`
      SELECT
        s.id, s.status, s.total_price, s.payment_status,
        s.scheduled_date, s.estimated_duration, s.actual_duration,
        s.location_address, s.location_lat, s.location_lng,
        s.special_instructions, s.created_at, s.matched_at,
        s.started_at, s.completed_at, s.discount_amount, s.promo_code_id,
        st.name AS service_type_name,
        st.description AS service_type_description,
        u.id AS user_id, u.name AS user_name,
        CASE WHEN s.cleaner_id = ${auth.cleanerId}
          THEN u.phone ELSE NULL END AS user_phone,
        u.profile_image_url AS user_avatar,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id, 'name', a.name, 'price', a.price, 'quantity', sel.quantity
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS addons
      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN service_addon_selections sel ON sel.service_id = s.id
      LEFT JOIN service_addons a ON a.id = sel.addon_id
      WHERE s.id = ${id}
        AND (
          (s.cleaner_id IS NULL AND s.status = 'requested')
          OR s.cleaner_id = ${auth.cleanerId}
        )
      GROUP BY s.id, st.id, u.id
    `;

    if (response.length === 0) {
      throw new AppError(404, "Job not found", "NOT_FOUND");
    }

    const raw = response[0];
    const data = {
      ...raw,
      location_lat: Number(raw.location_lat),
      location_lng: Number(raw.location_lng),
      estimated_duration: Number(raw.estimated_duration),
      actual_duration:
        raw.actual_duration === null ? null : Number(raw.actual_duration),
      total_price: Number(raw.total_price),
      discount_amount:
        raw.discount_amount === null ? 0 : Number(raw.discount_amount),
      addons: (raw.addons ?? []).map(
        (a: { price: string; quantity: string }) => ({
          ...a,
          price: Number(a.price),
          quantity: Number(a.quantity),
        }),
      ),
    };

    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching job");
  }
}
