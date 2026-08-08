import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth } from "@/lib/server-auth";
import { SavedLocation } from "@/types/type";

const LOCATION_TYPES = ["home", "work", "other"] as const;
type LocationType = (typeof LOCATION_TYPES)[number];

function parseLocationType(value: unknown): LocationType {
  if (
    typeof value === "string" &&
    LOCATION_TYPES.includes(value as LocationType)
  ) {
    return value as LocationType;
  }
  throw new AppError(400, "Invalid location type", "VALIDATION_ERROR");
}

export async function GET(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT id, name, address, latitude, longitude, location_type, is_default
      FROM saved_locations
      WHERE user_id = ${auth.userId}
      ORDER BY location_type, name
    `;

    const locations = rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      location_type: row.location_type,
      is_default: row.is_default,
    }));

    return jsonResponse({ data: locations });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching saved locations");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const body = await request.json();
    const { name, address, latitude, longitude, locationType } = body;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 50
    ) {
      throw new AppError(
        400,
        "Name is required (max 50 characters)",
        "VALIDATION_ERROR",
      );
    }

    if (
      typeof address !== "string" ||
      address.trim().length === 0 ||
      address.trim().length > 500
    ) {
      throw new AppError(400, "Address is required", "VALIDATION_ERROR");
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new AppError(400, "Invalid coordinates", "VALIDATION_ERROR");
    }

    const type = parseLocationType(locationType ?? "other");
    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      INSERT INTO saved_locations (user_id, name, address, latitude, longitude, location_type)
      VALUES (${auth.userId}, ${name.trim()}, ${address.trim()}, ${lat}, ${lng}, ${type})
      ON CONFLICT (user_id, name) DO UPDATE SET
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location_type = EXCLUDED.location_type,
        updated_at = NOW()
      RETURNING id, name, address, latitude, longitude, location_type, is_default
    `;

    const row = rows[0];
    const location: SavedLocation = {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      location_type: row.location_type,
      is_default: row.is_default,
    };

    return jsonResponse({ data: location }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error saving location");
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    const body = await request.json();
    const { id } = body;

    if (typeof id !== "string" || id.length === 0) {
      throw new AppError(400, "Location id is required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const rows = await sql`
      DELETE FROM saved_locations
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING id
    `;

    if (rows.length === 0) {
      throw new AppError(404, "Location not found", "NOT_FOUND");
    }

    return jsonResponse({ data: { success: true } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error deleting location");
  }
}
