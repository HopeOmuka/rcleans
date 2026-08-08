import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireCleanerAuth } from "@/lib/server-auth";
import { sendPush } from "@/lib/push";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const auth = await requireCleanerAuth(request);
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      throw new AppError(400, "Job ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Atomic claim: succeeds only if the job is still unclaimed — either an
    // open job (cleaner_id IS NULL) that any cleaner can take, or a job the
    // customer reserved for this cleaner (cleaner_id = me).
    const result = await sql`
      UPDATE services
      SET cleaner_id = ${auth.cleanerId}, status = 'matched', matched_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
        AND status = 'requested'
        AND (cleaner_id IS NULL OR cleaner_id = ${auth.cleanerId})
      RETURNING id, status, cleaner_id, payment_status, stripe_payment_intent_id
    `;

    if (result.length === 0) {
      const existing = await sql`
        SELECT status, cleaner_id FROM services WHERE id = ${jobId}
      `;
      if (existing.length === 0) {
        throw new AppError(404, "Job not found", "NOT_FOUND");
      }
      throw new AppError(
        409,
        "Job is no longer available for acceptance",
        "CONFLICT",
      );
    }

    const claimed = result[0];

    // The customer paid with a hold (manual capture). Now that the job is
    // accepted, take the money. Refunds are not needed: rejecting the job
    // releases the hold with no charge.
    let payment_status = claimed.payment_status;
    if (
      claimed.payment_status === "authorized" &&
      claimed.stripe_payment_intent_id
    ) {
      try {
        const captured = await stripe.paymentIntents.capture(
          claimed.stripe_payment_intent_id,
        );
        if (captured.status === "succeeded") {
          await sql`
            UPDATE services SET payment_status = 'paid', updated_at = NOW()
            WHERE id = ${jobId}
          `;
          payment_status = "paid";
        }
      } catch (err) {
        console.error("Payment capture failed after job acceptance:", err);
      }
    }

    await sql`
      INSERT INTO notifications (user_id, service_id, type, title, message, data)
      SELECT user_id, ${jobId}, 'service_matched', 'Cleaner Assigned',
        'A cleaner has been assigned to your service request.',
        JSONB_BUILD_OBJECT('service_id', ${jobId}::text, 'cleaner_id', ${auth.cleanerId}::text)
      FROM services WHERE id = ${jobId}
    `;

    const [assignedService] = await sql`
      SELECT user_id FROM services WHERE id = ${jobId}
    `;
    if (assignedService) {
      void sendPush({
        userId: assignedService.user_id,
        title: "Cleaner Assigned",
        body: "A cleaner has been assigned to your service request.",
        data: { service_id: jobId },
      });
    }

    return jsonResponse({ data: { ...result[0], payment_status } });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error accepting job");
  }
}
