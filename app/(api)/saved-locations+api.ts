import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const locations = await sql`
      SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        location_type,
        is_default,
        created_at
      FROM saved_locations
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;

    return Response.json({ data: locations });
  } catch (error) {
    console.error("Error fetching saved locations:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      address,
      latitude,
      longitude,
      locationType,
      isDefault,
    } = body;

    if (!userId || !name || !address || latitude == null || longitude == null) {
      return Response.json({ error: "All fields required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    if (isDefault) {
      await sql`
        UPDATE saved_locations
        SET is_default = false
        WHERE user_id = ${userId}
      `;
    }

    const result = await sql`
      INSERT INTO saved_locations (user_id, name, address, latitude, longitude, location_type, is_default)
      VALUES (${userId}, ${name}, ${address}, ${latitude}, ${longitude}, ${locationType || "other"}, ${isDefault || false})
      RETURNING id, name, address, latitude, longitude, location_type, is_default
    `;

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("Error saving location:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return Response.json({ error: "Location ID required" }, { status: 400 });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    await sql`DELETE FROM saved_locations WHERE id = ${locationId}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
