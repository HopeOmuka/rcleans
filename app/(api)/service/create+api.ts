import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      service_type_id, location_address, location_lat, location_lng,
      scheduled_date, estimated_duration, total_price, payment_status,
      cleaner_id, user_id, addons, promo_code_id, discount_amount,
    } = body;

    if (!service_type_id || !location_address || !location_lat || !location_lng ||
        !estimated_duration || !total_price || !payment_status || !user_id) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    const parsedTotal = Number(total_price);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      throw new AppError(400, "Invalid total price", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const status = cleaner_id ? "accepted" : "requested";

    const serviceResponse = await sql`
      INSERT INTO services (
        service_type_id, location_address, location_lat, location_lng,
        scheduled_date, estimated_duration, total_price, discount_amount,
        promo_code_id, status, payment_status, cleaner_id, user_id
      ) VALUES (
        ${service_type_id}, ${location_address}, ${location_lat}, ${location_lng},
        ${scheduled_date || null}, ${estimated_duration}, ${parsedTotal},
        ${discount_amount || 0}, ${promo_code_id || null}, ${status},
        ${payment_status}, ${cleaner_id || null}, ${user_id}
      )
      RETURNING *;
    `;

    const service = serviceResponse[0];

    if (addons && Array.isArray(addons) && addons.length > 0) {
      for (const addon of addons) {
        await sql`
          INSERT INTO service_addon_selections (
            service_id, addon_id, quantity, price_at_time
          ) VALUES (
            ${service.id}, ${addon.id}, ${addon.quantity || 1},
            ${addon.price_at_time || addon.price}
          );
        `;
      }
    }

    return jsonResponse({ data: service }, 201);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error creating service");
  }
}
