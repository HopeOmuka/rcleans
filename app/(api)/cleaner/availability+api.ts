import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_SLOTS = 50;

export async function GET(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);

    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT * FROM cleaner_availability
      WHERE cleaner_id = ${auth.cleanerId}
      ORDER BY day_of_week, start_time;
    `;

    return jsonResponse({ data: response });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching cleaner availability");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);
    const body = await request.json();
    const { availability } = body;

    if (!Array.isArray(availability) || availability.length === 0) {
      throw new AppError(
        400,
        "Availability array required",
        "VALIDATION_ERROR",
      );
    }
    if (availability.length > MAX_SLOTS) {
      throw new AppError(
        400,
        `Too many availability slots (max ${MAX_SLOTS})`,
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const queries: ReturnType<typeof sql>[] = [
      sql`DELETE FROM cleaner_availability WHERE cleaner_id = ${auth.cleanerId}`,
    ];
    for (const slot of availability) {
      const { day_of_week, start_time, end_time, is_available } = slot;
      if (day_of_week === undefined || !start_time || !end_time) continue;
      if (
        typeof day_of_week !== "number" ||
        day_of_week < 0 ||
        day_of_week > 6
      ) {
        throw new AppError(400, "day_of_week must be 0-6", "VALIDATION_ERROR");
      }
      if (
        typeof start_time !== "string" ||
        typeof end_time !== "string" ||
        !TIME_RE.test(start_time) ||
        !TIME_RE.test(end_time)
      ) {
        throw new AppError(
          400,
          "Invalid time format (expected HH:MM)",
          "VALIDATION_ERROR",
        );
      }
      if (is_available !== undefined && typeof is_available !== "boolean") {
        throw new AppError(
          400,
          "is_available must be a boolean",
          "VALIDATION_ERROR",
        );
      }
      queries.push(
        sql`
          INSERT INTO cleaner_availability (cleaner_id, day_of_week, start_time, end_time, is_available)
          VALUES (${auth.cleanerId}, ${day_of_week}, ${start_time}, ${end_time}, ${is_available ?? true})
          ON CONFLICT (cleaner_id, day_of_week)
          DO UPDATE SET
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            is_available = EXCLUDED.is_available,
            updated_at = NOW()
          RETURNING *
        `,
      );
    }

    if (queries.length === 1) {
      throw new AppError(
        400,
        "No valid availability slots provided",
        "VALIDATION_ERROR",
      );
    }

    // Replace the cleaner's schedule atomically so a mid-loop failure can
    // never wipe an existing schedule.
    const results = await sql.transaction(queries);
    const inserted = results.slice(1).map((r) => r[0]);

    return jsonResponse({ data: inserted });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error setting cleaner availability");
  }
}
