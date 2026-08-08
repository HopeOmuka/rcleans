import { type NeonQueryFunction } from "@neondatabase/serverless";
import { AppError } from "@/lib/api-error";

/**
 * Server-only pricing helpers. The client never supplies prices:
 * every amount is recomputed here from the database.
 */

type Sql = NeonQueryFunction<false, false>;

export interface AddonInput {
  id: string;
  quantity?: number;
}

export interface PriceBreakdown {
  subtotal: number;
  addonTotal: number;
  discountAmount: number;
  total: number;
  addonPrices: { id: string; price: number; quantity: number }[];
}

export async function computeBookingPrice(
  sql: Sql,
  opts: {
    serviceTypeId: string;
    estimatedDurationMinutes: number;
    addons?: AddonInput[];
  },
): Promise<PriceBreakdown> {
  const { serviceTypeId, estimatedDurationMinutes, addons = [] } = opts;

  const [serviceType] = await sql`
    SELECT id, base_price, price_per_hour, estimated_duration_hours
    FROM service_types WHERE id = ${serviceTypeId}
  `;
  if (!serviceType) {
    throw new AppError(404, "Service type not found", "NOT_FOUND");
  }

  const base = Number(serviceType.base_price);
  const perHour = Number(serviceType.price_per_hour);
  const subtotal = base + (estimatedDurationMinutes / 60) * perHour;

  let addonTotal = 0;
  const addonPrices: { id: string; price: number; quantity: number }[] = [];

  if (addons.length > 0) {
    const ids = addons.map((a) => a.id);
    const rows = (await sql`
      SELECT id, name, price, is_active, service_type_ids
      FROM service_addons
      WHERE id = ANY(${ids})
    `) as Record<string, any>[];
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const addon of addons) {
      const row = byId.get(addon.id);
      if (!row || row.is_active !== true) {
        throw new AppError(400, `Invalid add-on selected: ${addon.id}`, "VALIDATION_ERROR");
      }
      // An add-on scoped to specific service types must not be bookable
      // with a different service type, regardless of what the client sends.
      const scoped = Array.isArray(row.service_type_ids)
        ? (row.service_type_ids as string[])
        : [];
      if (scoped.length > 0 && !scoped.includes(serviceTypeId)) {
        throw new AppError(
          400,
          `"${row.name}" is not available for this service type`,
          "VALIDATION_ERROR",
        );
      }
      const quantity = Math.max(1, Math.min(99, Math.floor(addon.quantity ?? 1)));
      const price = Number(row.price) * quantity;
      addonTotal += price;
      addonPrices.push({ id: addon.id, price: Number(row.price), quantity });
    }
  }

  return { subtotal, addonTotal, discountAmount: 0, total: subtotal + addonTotal, addonPrices };
}

export interface PromoResult {
  promoId: string;
  code: string;
  discountAmount: number;
}

export async function resolvePromo(
  sql: Sql,
  opts: {
    code: string;
    serviceTypeId: string;
    orderAmount: number;
    userId: string;
  },
): Promise<PromoResult> {
  const { code, serviceTypeId, orderAmount, userId } = opts;

  const [promo] = await sql`
    SELECT * FROM promo_codes
    WHERE code = ${code}
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
  `;
  if (!promo) {
    throw new AppError(400, "Invalid or expired promo code", "PROMO_INVALID");
  }

  if (Number(promo.minimum_order_amount) > 0 && orderAmount < Number(promo.minimum_order_amount)) {
    throw new AppError(
      400,
      `Minimum order amount of $${Number(promo.minimum_order_amount).toFixed(2)} required`,
      "PROMO_MINIMUM",
    );
  }

  if (promo.applicable_service_types?.length > 0) {
    if (!promo.applicable_service_types.includes(serviceTypeId)) {
      throw new AppError(400, "Promo code not applicable to this service type", "PROMO_NOT_APPLICABLE");
    }
  }

  const [redemptions] = await sql`
    SELECT COUNT(*)::integer AS used
    FROM promo_redemptions
    WHERE promo_code_id = ${promo.id} AND user_id = ${userId}
  `;
  const maxPerUser = promo.max_uses_per_user ?? 1;
  if ((redemptions?.used ?? 0) >= maxPerUser) {
    throw new AppError(400, "Promo code already used by this account", "PROMO_USED");
  }

  let discountAmount = 0;
  if (promo.discount_type === "percentage") {
    discountAmount = (orderAmount * Number(promo.discount_value)) / 100;
  } else if (promo.discount_type === "fixed_amount") {
    discountAmount = Number(promo.discount_value);
  }

  if (promo.maximum_discount_amount && discountAmount > Number(promo.maximum_discount_amount)) {
    discountAmount = Number(promo.maximum_discount_amount);
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  return { promoId: promo.id, code: promo.code, discountAmount };
}
