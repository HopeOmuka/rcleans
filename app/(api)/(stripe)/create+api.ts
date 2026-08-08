import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";
import { computeBookingPrice, resolvePromo } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Creates a Stripe customer + PaymentIntent.
 * The amount is ALWAYS computed server-side — either from an existing
 * service record (serviceId) or from booking inputs (serviceTypeId + addons + promo).
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`stripe:create:${auth.userId}`, 20, 60_000);
    const body = await request.json();
    const {
      name,
      email,
      serviceId,
      serviceTypeId,
      estimatedDuration,
      addons,
      promoCode,
    } = body;

    const sql = neon(`${process.env.DATABASE_URL}`);

    let amountCents: number;
    let bookingMetadata: Record<string, string> = {};

    if (serviceId) {
      const [service] = await sql`
        SELECT id, user_id, total_price, status FROM services WHERE id = ${serviceId}
      `;
      if (!service) {
        throw new AppError(404, "Service not found", "NOT_FOUND");
      }
      if (service.user_id !== auth.userId) {
        throw new AppError(
          403,
          "Not authorized to pay for this service",
          "FORBIDDEN",
        );
      }
      if (service.status !== "completed") {
        throw new AppError(
          400,
          "Service can only be paid after completion",
          "INVALID_STATE",
        );
      }
      amountCents = Math.round(Number(service.total_price) * 100);
      bookingMetadata = { serviceId: service.id };
    } else {
      if (!serviceTypeId || !estimatedDuration) {
        throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
      }
      const duration = Number(estimatedDuration);
      if (isNaN(duration) || duration <= 0 || duration > 24 * 60) {
        throw new AppError(
          400,
          "Invalid estimated duration",
          "VALIDATION_ERROR",
        );
      }
      const addonList = Array.isArray(addons)
        ? addons.map((a) => ({ id: String(a.id), quantity: a.quantity }))
        : [];

      const { subtotal, addonTotal } = await computeBookingPrice(sql, {
        serviceTypeId,
        estimatedDurationMinutes: duration,
        addons: addonList,
      });

      let discount = 0;
      if (promoCode) {
        const promo = await resolvePromo(sql, {
          code: String(promoCode).trim().toUpperCase(),
          serviceTypeId,
          orderAmount: subtotal + addonTotal,
          userId: auth.userId,
        });
        discount = promo.discountAmount;
      }

      amountCents = Math.round((subtotal + addonTotal - discount) * 100);
      bookingMetadata = { serviceTypeId };
    }

    if (amountCents <= 0) {
      throw new AppError(400, "Invalid payment amount", "VALIDATION_ERROR");
    }

    const [existingCustomer] = (
      await stripe.customers.list({ email, limit: 1 })
    ).data;
    const customer =
      existingCustomer ||
      (await stripe.customers.create({
        name,
        email,
        metadata: { app: "rcleans" },
      }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customer.id,
      metadata: {
        app: "rcleans",
        user_id: auth.userId,
        ...bookingMetadata,
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      // Pre-flight bookings are authorized but NOT captured: the money is
      // held until the customer's chosen cleaner accepts the job (captured
      // server-side in accept-job). Payments for a completed service
      // (serviceId present) are captured immediately, as before.
      capture_method: serviceId ? "automatic" : "manual",
    });

    return jsonResponse({
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customer.id,
        amountCents,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating payment intent");
  }
}
