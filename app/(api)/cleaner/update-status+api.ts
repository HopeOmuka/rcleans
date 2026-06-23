import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, status } = body;

    if (!jobId || !status) {
      return Response.json(
        { error: "Job ID and status required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    let setClause = "status = $1";
    const params: any[] = [status];

    switch (status) {
      case "arrived":
        setClause = "status = $1, matched_at = NOW()";
        break;
      case "in_progress":
        setClause = "status = $1, started_at = NOW()";
        break;
      case "completed":
        setClause = "status = $1, completed_at = NOW()";
        break;
    }

    params.push(jobId);

    const result = await sql.query(
      `UPDATE services SET ${setClause} WHERE id = $2 RETURNING id, status, cleaner_id`,
      params,
    );

    if (result.rowCount === 0) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    let notifType = "system_message";
    let notifTitle = "Status Update";
    let notifMessage = "Your service status has been updated.";

    if (status === "arrived") {
      notifType = "service_started";
      notifTitle = "Cleaner Arrived";
      notifMessage = "Your cleaner has arrived at the location.";
    } else if (status === "in_progress") {
      notifType = "service_started";
      notifTitle = "Service Started";
      notifMessage = "Your cleaner has started the service.";
    } else if (status === "completed") {
      notifType = "service_completed";
      notifTitle = "Service Completed";
      notifMessage = "Your cleaning service has been completed!";
    }

    const serviceData = await sql.query(
      `SELECT user_id FROM services WHERE id = $1`,
      [jobId],
    );

    if (serviceData.rowCount > 0) {
      await sql.query(
        `INSERT INTO notifications (user_id, service_id, type, title, message, data) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          serviceData.rows[0].user_id,
          jobId,
          notifType,
          notifTitle,
          notifMessage,
          JSON.stringify({ service_id: jobId, status }),
        ],
      );
    }

    return Response.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error updating job status:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
