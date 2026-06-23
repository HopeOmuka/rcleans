import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    const parsedAmount = Math.round(Number(amount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError(400, "Invalid amount", "VALIDATION_ERROR");
    }

    const [existingCustomer] = (await stripe.customers.list({ email })).data;
    const customer = existingCustomer || await stripe.customers.create({ name, email });

    const [ephemeralKey, paymentIntent] = await Promise.all([
      stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2024-06-20" },
      ),
      stripe.paymentIntents.create({
        amount: parsedAmount,
        currency: "usd",
        customer: customer.id,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      }),
    ]);

    return jsonResponse({ paymentIntent, ephemeralKey, customer: customer.id });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error creating payment intent");
  }
}
