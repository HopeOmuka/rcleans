import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get("cleanerId");

    if (!cleanerId) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT * FROM cleaner_availability
      WHERE cleaner_id = ${cleanerId}
      ORDER BY day_of_week, start_time;
    `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error fetching cleaner availability");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cleaner_id, cleanerId, availability } = body;
    const cid = cleaner_id || cleanerId;

    if (!cid) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    if (!Array.isArray(availability) || availability.length === 0) {
      throw new AppError(400, "Availability array required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Delete all existing availability and re-insert
    await sql`DELETE FROM cleaner_availability WHERE cleaner_id = ${cid}`;

    const inserted = [];
    for (const slot of availability) {
      const { day_of_week, start_time, end_time, is_available } = slot;
      if (day_of_week === undefined || !start_time || !end_time) continue;
      if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) continue;

      const result = await sql`
        INSERT INTO cleaner_availability (cleaner_id, day_of_week, start_time, end_time, is_available)
        VALUES (${cid}, ${day_of_week}, ${start_time}, ${end_time}, ${is_available ?? true})
        ON CONFLICT (cleaner_id, day_of_week)
        DO UPDATE SET
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          is_available = EXCLUDED.is_available,
          updated_at = NOW()
        RETURNING *;
      `;
      inserted.push(result[0]);
    }

    return jsonResponse({ data: inserted });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error setting cleaner availability");
  }
}
