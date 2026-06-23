import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, serviceTypeId, orderAmount } = body;

    if (!code || !orderAmount) {
      throw new AppError(400, "Promo code and order amount required", "VALIDATION_ERROR");
    }

    const parsedAmount = Number(orderAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError(400, "Invalid order amount", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const promoCodes = await sql`
      SELECT * FROM promo_codes
      WHERE code = ${code}
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit);
    `;

    if (promoCodes.length === 0) {
      throw new AppError(400, "Invalid or expired promo code", "PROMO_INVALID");
    }

    const promo = promoCodes[0];

    if (parsedAmount < promo.minimum_order_amount) {
      throw new AppError(
        400,
        `Minimum order amount of $${promo.minimum_order_amount} required`,
        "PROMO_MINIMUM",
      );
    }

    if (promo.applicable_service_types?.length > 0) {
      if (!promo.applicable_service_types.includes(serviceTypeId)) {
        throw new AppError(400, "Promo code not applicable to this service type", "PROMO_NOT_APPLICABLE");
      }
    }

    let discountAmount = 0;
    if (promo.discount_type === "percentage") {
      discountAmount = (parsedAmount * promo.discount_value) / 100;
    } else if (promo.discount_type === "fixed_amount") {
      discountAmount = promo.discount_value;
    }

    if (promo.maximum_discount_amount && discountAmount > promo.maximum_discount_amount) {
      discountAmount = promo.maximum_discount_amount;
    }

    discountAmount = Math.min(discountAmount, parsedAmount);

    await sql`
      UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = ${code}
    `;

    return jsonResponse({
      data: {
        promoCode: promo,
        discountAmount,
        finalAmount: parsedAmount - discountAmount,
        originalAmount: parsedAmount,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    return errorResponse(error, "Error validating promo code");
  }
}
