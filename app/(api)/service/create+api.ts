import { neon } from "@neondatabase/serverless";
import { Stripe } from "stripe";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit } from "@/lib/server-auth";
import { computeBookingPrice, resolvePromo } from "@/lib/pricing";
import { randomUUID } from "node:crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const RECURRENCES = ["none", "weekly", "biweekly", "monthly"] as const;
const RECURRING_OCCURRENCES = 4;

function nextOccurrence(date: Date, recurrence: string): Date {
  const next = new Date(date);
  if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "biweekly") {
    next.setDate(next.getDate() + 14);
  } else {
    const month = next.getMonth();
    next.setMonth(month + 1);
    if (next.getMonth() === (month + 1) % 12) {
      next.setDate(0);
    }
  }
  return next;
}

export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`service:create:${auth.userId}`, 20, 60_000);

    const body = await request.json();
    const {
      service_type_id,
      location_address,
      location_lat,
      location_lng,
      scheduled_date,
      estimated_duration,
      cleaner_id,
      addons,
      promo_code,
      payment_mode,
      payment_intent_id,
      special_instructions,
      recurrence,
    } = body;

    if (!service_type_id || !location_address || !estimated_duration) {
      throw new AppError(400, "Missing required fields", "VALIDATION_ERROR");
    }

    if (
      typeof location_address !== "string" ||
      location_address.trim().length < 5
    ) {
      throw new AppError(
        400,
        "A valid service location is required",
        "VALIDATION_ERROR",
      );
    }
    if (location_address.length > 500) {
      throw new AppError(400, "Location address too long", "VALIDATION_ERROR");
    }

    const lat = Number(location_lat);
    const lng = Number(location_lng);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new AppError(
        400,
        "Invalid location coordinates",
        "VALIDATION_ERROR",
      );
    }

    const duration = Number(estimated_duration);
    if (isNaN(duration) || duration <= 0 || duration > 24 * 60) {
      throw new AppError(400, "Invalid estimated duration", "VALIDATION_ERROR");
    }

    let scheduled: Date | null = null;
    if (scheduled_date) {
      scheduled = new Date(scheduled_date);
      if (isNaN(scheduled.getTime())) {
        throw new AppError(400, "Invalid scheduled date", "VALIDATION_ERROR");
      }
      if (scheduled.getTime() < Date.now() - 5 * 60 * 1000) {
        throw new AppError(
          400,
          "Scheduled date must be in the future",
          "VALIDATION_ERROR",
        );
      }
    }

    const recur = typeof recurrence === "string" ? recurrence : "none";
    if (!(RECURRENCES as readonly string[]).includes(recur)) {
      throw new AppError(
        400,
        "recurrence must be one of: none, weekly, biweekly, monthly",
        "VALIDATION_ERROR",
      );
    }
    if (recur !== "none" && !scheduled) {
      throw new AppError(
        400,
        "Scheduled date is required for recurring bookings",
        "VALIDATION_ERROR",
      );
    }

    const addonList = Array.isArray(addons)
      ? addons.map((a) => ({ id: String(a.id), quantity: a.quantity }))
      : [];

    let specialInstructions: string | null = null;
    if (special_instructions != null) {
      if (typeof special_instructions !== "string") {
        throw new AppError(
          400,
          "Invalid special instructions",
          "VALIDATION_ERROR",
        );
      }
      const trimmed = special_instructions.trim();
      if (trimmed.length > 2000) {
        throw new AppError(
          400,
          "Special instructions must be under 2000 characters",
          "VALIDATION_ERROR",
        );
      }
      specialInstructions = trimmed.length > 0 ? trimmed : null;
    }

    if (payment_mode !== "now" && payment_mode !== "later") {
      throw new AppError(
        400,
        "payment_mode must be 'now' or 'later'",
        "VALIDATION_ERROR",
      );
    }
    if (payment_mode === "now" && !payment_intent_id) {
      throw new AppError(
        400,
        "payment_intent_id is required for pay-now bookings",
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const { subtotal, addonTotal, addonPrices } = await computeBookingPrice(
      sql,
      {
        serviceTypeId: service_type_id,
        estimatedDurationMinutes: duration,
        addons: addonList,
      },
    );

    let promoId: string | null = null;
    let promoDiscount = 0;
    if (promo_code) {
      if (typeof promo_code !== "string") {
        throw new AppError(400, "Invalid promo code", "VALIDATION_ERROR");
      }
      const promo = await resolvePromo(sql, {
        code: promo_code.trim().toUpperCase(),
        serviceTypeId: service_type_id,
        orderAmount: subtotal + addonTotal,
        userId: auth.userId,
      });
      promoId = promo.promoId;
      promoDiscount = promo.discountAmount;
    }

    const total = Math.max(
      0,
      Math.round((subtotal + addonTotal - promoDiscount) * 100) / 100,
    );

    let cleaner: { id: string; is_available: boolean } | null = null;
    if (cleaner_id) {
      [cleaner] = (await sql`
        SELECT id, is_available FROM cleaners WHERE id = ${String(cleaner_id)}
      `) as { id: string; is_available: boolean }[];
      if (!cleaner) {
        throw new AppError(404, "Cleaner not found", "NOT_FOUND");
      }
      if (!cleaner.is_available) {
        throw new AppError(
          400,
          "Cleaner is not currently available",
          "CLEANER_UNAVAILABLE",
        );
      }
    }

    // Pay-now bookings: verify the PaymentIntent server-side. A confirmed
    // manual-capture intent (requires_capture) means the money is HELD but
    // not taken — it is captured only when the cleaner accepts the job.
    let paymentStatus: "paid" | "authorized" | "pending" = "pending";
    let stripeIntentId: string | null = null;
    if (payment_mode === "now") {
      const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
      if (
        intent.status !== "succeeded" &&
        intent.status !== "requires_capture"
      ) {
        throw new AppError(
          400,
          "Payment has not been completed",
          "PAYMENT_NOT_VERIFIED",
        );
      }
      if (
        intent.metadata?.app !== "rcleans" ||
        intent.metadata?.user_id !== auth.userId
      ) {
        throw new AppError(
          400,
          "Payment intent does not belong to this booking",
          "PAYMENT_NOT_VERIFIED",
        );
      }
      if (intent.amount !== Math.round(total * 100)) {
        throw new AppError(
          400,
          "Payment amount does not match booking total",
          "AMOUNT_MISMATCH",
        );
      }
      // Money held but not captured until a cleaner accepts the job.
      paymentStatus = intent.status === "succeeded" ? "paid" : "authorized";
      stripeIntentId = intent.id;

      // Idempotency: a retry after a partial failure (e.g. the client
      // timed out during INSERT) must not create a duplicate booking for
      // the same paid intent.
      const [existingService] = (await sql`
        SELECT * FROM services WHERE stripe_payment_intent_id = ${payment_intent_id}
      `) as Record<string, unknown>[];
      if (existingService) {
        return jsonResponse({ data: existingService }, 200);
      }
    }

    const serviceId = randomUUID();
    // The cleaner must accept the job before it is matched — a picked cleaner
    // creates a reserved, requested job that only they can accept.
    const status = "requested";

    // Recurring bookings create a series: the parent service the customer
    // just paid for, plus future occurrences (same cleaner, location,
    // price, addons) that are booked pay-later. Each occurrence is a
    // separate service row the user pays when it comes due.
    const series: {
      id: string;
      scheduled: Date | null;
      parent: string | null;
    }[] = [{ id: serviceId, scheduled, parent: null }];
    if (recur !== "none" && scheduled) {
      let next = scheduled;
      for (let i = 0; i < RECURRING_OCCURRENCES; i++) {
        next = nextOccurrence(next, recur);
        series.push({ id: randomUUID(), scheduled: next, parent: serviceId });
      }
    }

    const queries: ReturnType<typeof sql>[] = series.flatMap((entry) => {
      const rows = [
        sql`
          INSERT INTO services (
            id, service_type_id, location_address, location_lat, location_lng,
            scheduled_date, estimated_duration, total_price, discount_amount,
            promo_code_id, status, payment_status, cleaner_id, user_id,
            stripe_payment_intent_id, special_instructions,
            recurrence, recurring_parent_id
          ) VALUES (
            ${entry.id}, ${service_type_id}, ${location_address.trim()}, ${lat}, ${lng},
            ${entry.scheduled}, ${duration}, ${total}, ${promoDiscount},
            ${promoId}, ${status}, ${
              entry.parent ? "pending" : paymentStatus
            }, ${cleaner?.id || null}, ${auth.userId},
            ${entry.parent ? null : stripeIntentId}, ${specialInstructions},
            ${recur}, ${entry.parent}
          )
          RETURNING *
        `,
        ...addonPrices.map(
          (a) => sql`
            INSERT INTO service_addon_selections (service_id, addon_id, quantity, price_at_time)
            VALUES (${entry.id}, ${a.id}, ${a.quantity}, ${a.price})
          `,
        ),
      ];
      if (entry.parent === null && promoId) {
        rows.push(
          sql`
            INSERT INTO promo_redemptions (promo_code_id, user_id, service_id)
            VALUES (${promoId}, ${auth.userId}, ${serviceId})
            ON CONFLICT (promo_code_id, user_id) DO NOTHING
          `,
          sql`
            UPDATE promo_codes SET usage_count = usage_count + 1
            WHERE id = ${promoId}
              AND (usage_limit IS NULL OR usage_count < usage_limit)
          `,
        );
      }
      return rows;
    });

    const results = await sql.transaction(queries);
    const service = results[0][0];

    return jsonResponse({ data: service }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating service");
  }
}
