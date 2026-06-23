import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id } = body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: customer_id },
    );

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    return jsonResponse({
      success: true,
      message: "Payment successful",
      result,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error processing payment");
  }
}
