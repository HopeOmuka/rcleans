import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, cleanerId } = body;

    if (!jobId || !cleanerId) {
      return Response.json(
        { error: "Job ID and Cleaner ID required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const result = await sql`
      UPDATE services
      SET 
        cleaner_id = ${cleanerId},
        status = 'matched',
        matched_at = NOW()
      WHERE id = ${jobId}
      RETURNING id, status, cleaner_id
    `;

    if (result.length === 0) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO notifications (user_id, service_id, type, title, message, data)
      SELECT 
        user_id,
        ${jobId},
        'service_matched',
        'Cleaner Assigned',
        'A cleaner has been assigned to your service request.',
        JSONB_BUILD_OBJECT('service_id', ${jobId}, 'cleaner_id', ${cleanerId})
      FROM services
      WHERE id = ${jobId}
    `;

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("Error accepting job:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
