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
      addons,
      special_instructions,
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

    const serviceResponse = await sql`
      INSERT INTO services (
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
          special_instructions,
          matched_at
      ) VALUES (
          ${service_type_id},
          ${location_address},
          ${Number(location_lat)},
          ${Number(location_lng)},
          ${scheduled_date || null},
          ${Number(estimated_duration)},
          ${Number(total_price)},
          ${status === "paid" ? "matched" : status},
          ${payment_status},
          ${cleaner_id},
          ${user_id},
          ${special_instructions || null},
          NOW()
      )
      RETURNING *;
    `;

    const service = serviceResponse[0];

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
              ${Number(addon.price_at_time || addon.price)}
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
