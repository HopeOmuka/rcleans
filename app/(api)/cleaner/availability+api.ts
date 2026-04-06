import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId");

  if (!cleanerId) {
    return Response.json({ error: "Cleaner ID required" }, { status: 400 });
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT * FROM cleaner_availability
      WHERE cleaner_id = ${cleanerId}
      ORDER BY day_of_week, start_time;
    `;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching cleaner availability:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cleanerId, dayOfWeek, startTime, endTime, isAvailable } = body;

    if (!cleanerId || dayOfWeek === undefined || !startTime || !endTime) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const response = await sql`
      INSERT INTO cleaner_availability (cleaner_id, day_of_week, start_time, end_time, is_available)
      VALUES (${cleanerId}, ${dayOfWeek}, ${startTime}, ${endTime}, ${isAvailable ?? true})
      ON CONFLICT (cleaner_id, day_of_week)
      DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_available = EXCLUDED.is_available,
        updated_at = NOW()
      RETURNING *;
    `;

    return Response.json({ data: response[0] });
  } catch (error) {
    console.error("Error setting cleaner availability:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
