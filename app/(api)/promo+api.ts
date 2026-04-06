import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, serviceTypeId, orderAmount } = body;

    if (!code || !orderAmount) {
      return Response.json(
        { error: "Promo code and order amount required" },
        { status: 400 },
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Find the promo code
    const promoCodes = await sql`
      SELECT * FROM promo_codes
      WHERE code = ${code}
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit);
    `;

    if (promoCodes.length === 0) {
      return Response.json(
        { error: "Invalid or expired promo code" },
        { status: 400 },
      );
    }

    const promo = promoCodes[0];

    // Check minimum order amount
    if (orderAmount < promo.minimum_order_amount) {
      return Response.json(
        {
          error: `Minimum order amount of $${promo.minimum_order_amount} required`,
        },
        { status: 400 },
      );
    }

    // Check if applicable to service type
    if (
      promo.applicable_service_types &&
      promo.applicable_service_types.length > 0
    ) {
      if (!promo.applicable_service_types.includes(serviceTypeId)) {
        return Response.json(
          {
            error: "Promo code not applicable to this service type",
          },
          { status: 400 },
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === "percentage") {
      discountAmount = (orderAmount * promo.discount_value) / 100;
    } else if (promo.discount_type === "fixed_amount") {
      discountAmount = promo.discount_value;
    }

    // Apply maximum discount limit if set
    if (
      promo.maximum_discount_amount &&
      discountAmount > promo.maximum_discount_amount
    ) {
      discountAmount = promo.maximum_discount_amount;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    const finalAmount = orderAmount - discountAmount;

    return Response.json({
      data: {
        promoCode: promo,
        discountAmount,
        finalAmount,
        originalAmount: orderAmount,
      },
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
