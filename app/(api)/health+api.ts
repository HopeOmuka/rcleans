import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const dbResult = await sql`SELECT 1 AS ok`;
    const dbHealthy = dbResult?.[0]?.ok === 1;

    return jsonResponse({
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealthy ? "connected" : "disconnected",
      },
      version: "1.0.0",
    });
  } catch (error) {
    return jsonResponse(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: "disconnected",
        },
      },
      503,
    );
  }
}
