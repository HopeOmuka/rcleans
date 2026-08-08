import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Confirms a PaymentIntent created by /(stripe)/create.
 * If the intent was created for an existing service (metadata.serviceId),
 * the service is marked paid here — server-side, only after Stripe reports
 * the intent as succeeded. The client can never mark a service paid itself.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`stripe:pay:${auth.userId}`, 10, 60_000);

    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id } = body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (
      intent.metadata?.app !== "rcleans" ||
      intent.metadata?.user_id !== auth.userId
    ) {
      throw new AppError(
        403,
        "Payment intent does not belong to this account",
        "FORBIDDEN",
      );
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      {
        customer: customer_id,
      },
    );

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    // Manual-capture intents (new pre-acceptance bookings) legitimately land
    // in requires_capture here — the hold is authorized but not taken.
    // Captured payments land in "succeeded".
    if (result.status !== "succeeded" && result.status !== "requires_capture") {
      throw new AppError(
        400,
        "Payment was not completed",
        "PAYMENT_NOT_VERIFIED",
      );
    }

    // Existing-service payment: reconcile server-side.
    if (intent.metadata?.serviceId) {
      const serviceId = intent.metadata.serviceId;
      const sql = neon(`${process.env.DATABASE_URL}`);
      const [service] = await sql`
        SELECT id, user_id, total_price, payment_status FROM services WHERE id = ${serviceId}
      `;
      if (service && service.user_id === auth.userId) {
        if (intent.amount !== Math.round(Number(service.total_price) * 100)) {
          throw new AppError(
            400,
            "Payment amount does not match service total",
            "AMOUNT_MISMATCH",
          );
        }
        await sql`
          UPDATE services
          SET payment_status = 'paid', stripe_payment_intent_id = ${intent.id}, updated_at = NOW()
          WHERE id = ${serviceId} AND payment_status = 'pending'
        `;
      } else {
        throw new AppError(
          403,
          "Not authorized to pay for this service",
          "FORBIDDEN",
        );
      }
    }

    return jsonResponse({
      data: {
        success: true,
        paymentIntentId: result.id,
        clientSecret: result.client_secret,
        status: result.status,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error processing payment");
  }
}
