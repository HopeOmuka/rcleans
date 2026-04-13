import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      service_type_id,
      location_address,
      location_lat,
      location_lng,
      scheduled_date,
      estimated_duration,
      total_price,
      status,
      payment_status,
      cleaner_id,
      user_id,
      addons, // Array of addon objects with id, quantity, price_at_time
      promo_code_id,
      discount_amount,
    } = body;

    if (
      !service_type_id ||
      !location_address ||
      !location_lat ||
      !location_lng ||
      !estimated_duration ||
      !total_price ||
      !status ||
      !payment_status ||
      !cleaner_id ||
      !user_id
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Create the service
    const serviceResponse = await sql`
      INSERT INTO services (
          service_type_id,
          location_address,
          location_lat,
          location_lng,
          scheduled_date,
          estimated_duration,
          total_price,
          discount_amount,
          promo_code_id,
          status,
          payment_status,
          cleaner_id,
          user_id
      ) VALUES (
          ${service_type_id},
          ${location_address},
          ${location_lat},
          ${location_lng},
          ${scheduled_date || null},
          ${estimated_duration},
          ${total_price},
          ${discount_amount || 0},
          ${promo_code_id || null},
          ${status},
          ${payment_status},
          ${cleaner_id},
          ${user_id}
      )
      RETURNING *;
    `;

    const service = serviceResponse[0];

    // Add addon selections if provided
    if (addons && addons.length > 0) {
      for (const addon of addons) {
        await sql`
          INSERT INTO service_addon_selections (
              service_id,
              addon_id,
              quantity,
              price_at_time
          ) VALUES (
              ${service.id},
              ${addon.id},
              ${addon.quantity || 1},
              ${addon.price_at_time || addon.price}
          );
        `;
      }
    }

    return Response.json({ data: service });
  } catch (error) {
    console.error("Error creating service:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
