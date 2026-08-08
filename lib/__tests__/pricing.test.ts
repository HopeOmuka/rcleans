import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/api-error";
import {
  computeBookingPrice,
  resolvePromo,
  type PriceBreakdown,
  type PromoResult,
} from "@/lib/pricing";

function makeSql(routes: Record<string, (params: unknown[]) => unknown[]>): any {
  const sql = async (strings: TemplateStringsArray, ...params: unknown[]) => {
    const query = strings[0].replace(/\s+/g, " ").trim();
    for (const [needle, rows] of Object.entries(routes)) {
      if (query.includes(needle)) {
        return rows(params);
      }
    }
    return [];
  };
  return sql;
}

const serviceTypesSql = () =>
  [{ id: "st-1", base_price: 20, price_per_hour: 25, estimated_duration_hours: 2 }];

const addonsSql = () => [
  { id: "ad-1", name: "Bleach", price: 5, is_active: true, service_type_ids: ["st-1"] },
  { id: "ad-2", name: "Mold", price: 8, is_active: true, service_type_ids: [] },
  { id: "ad-3", name: "Deactivated", price: 10, is_active: false, service_type_ids: [] },
];

describe("computeBookingPrice", () => {
  it("computes base + hourly subtotal", async () => {
    const sql = makeSql({ "FROM service_types": () => serviceTypesSql() });
    const result = await computeBookingPrice(sql, {
      serviceTypeId: "st-1",
      estimatedDurationMinutes: 120,
    });
    expect(result.subtotal).toBe(20 + 2 * 25);
    expect(result.addonTotal).toBe(0);
    expect(result.total).toBe(70);
  });

  it("throws NOT_FOUND for unknown service type", async () => {
    const sql = makeSql({ "FROM service_types": () => [] });
    await expect(
      computeBookingPrice(sql, { serviceTypeId: "nope", estimatedDurationMinutes: 60 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("sums validated add-ons with quantity", async () => {
    const sql = makeSql({
      "FROM service_types": () => serviceTypesSql(),
      "FROM service_addons": () => [
        { id: "ad-1", name: "Boss", price: 5, is_active: true, service_type_ids: ["st-1"] },
      ],
    });
    const result = await computeBookingPrice(sql, {
      serviceTypeId: "st-1",
      estimatedDurationMinutes: 60,
      addons: [{ id: "ad-1", quantity: 3 }],
    });
    expect(result.subtotal).toBe(20 + 25);
    expect(result.addonTotal).toBe(15);
    expect(result.addonPrices).toEqual([{ id: "ad-1", price: 5, quantity: 3 }]);
  });

  it("rejects inactive add-ons", async () => {
    const sql = makeSql({
      "FROM service_types": () => serviceTypesSql(),
      "FROM service_addons": () => [
        { id: "ad-3", name: "Deactivated", price: 10, is_active: false, service_type_ids: [] },
      ],
    });
    await expect(
      computeBookingPrice(sql, {
        serviceTypeId: "st-1",
        estimatedDurationMinutes: 60,
        addons: [{ id: "ad-3" }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects add-ons scoped to a different service type", async () => {
    const sql = makeSql({
      "FROM service_types": () => serviceTypesSql(),
      "FROM service_addons": () => [
        { id: "ad-1", name: "Boss", price: 5, is_active: true, service_type_ids: ["st-other"] },
      ],
    });
    await expect(
      computeBookingPrice(sql, {
        serviceTypeId: "st-1",
        estimatedDurationMinutes: 60,
        addons: [{ id: "ad-1" }],
      }),
    ).rejects.toMatchObject({ message: '"Boss" is not available for this service type' });
  });
});

describe("resolvePromo", () => {
  const promoBase = {
    id: "p-1",
    code: "SAVE20",
    discount_type: "percentage",
    discount_value: 20,
    maximum_discount_amount: 25,
    minimum_order_amount: 10,
    usage_limit: 100,
    usage_count: 0,
    max_uses_per_user: 1,
    applicable_service_types: [],
    valid_from: null,
    valid_until: null,
    is_active: true,
  };

  function promoSql(
    promoRows: Record<string, unknown>[],
    used = 0,
    applicable: string[] = [],
  ) {
    return makeSql({
      "FROM promo_codes": () =>
        promoRows.map((r) => ({ ...promoBase, ...r, applicable_service_types: applicable })),
      "FROM promo_redemptions": () => [{ used }],
    });
  }

  it("applies percentage discount capped by maximum", async () => {
    const sql = promoSql([{}], 0);
    const result: PromoResult = await resolvePromo(sql, {
      code: "SAVE20",
      serviceTypeId: "st-1",
      orderAmount: 100,
      userId: "u-1",
    });
    expect(result.discountAmount).toBe(20);
  });

  it("caps percentage discount at maximum_discount_amount", async () => {
    const sql = promoSql([{}], 0);
    const result = await resolvePromo(sql, {
      code: "SAVE20",
      serviceTypeId: "st-1",
      orderAmount: 200,
      userId: "u-1",
    });
    expect(result.discountAmount).toBe(25);
  });

  it("never discounts more than the order amount", async () => {
    const sql = promoSql(
      [{ discount_type: "fixed_amount", discount_value: 500, maximum_discount_amount: null }],
      0,
    );
    const result = await resolvePromo(sql, {
      code: "SAVE20",
      serviceTypeId: "st-1",
      orderAmount: 30,
      userId: "u-1",
    });
    expect(result.discountAmount).toBe(30);
  });

  it("throws PROMO_INVALID when no active promo matches", async () => {
    const sql = promoSql([], 0);
    await expect(
      resolvePromo(sql, {
        code: "SAVE20",
        serviceTypeId: "st-1",
        orderAmount: 100,
        userId: "u-1",
      }),
    ).rejects.toMatchObject({ code: "PROMO_INVALID" });
  });

  it("throws PROMO_MINIMUM below minimum order amount", async () => {
    const sql = promoSql([{}], 0);
    await expect(
      resolvePromo(sql, {
        code: "SAVE20",
        serviceTypeId: "st-1",
        orderAmount: 5,
        userId: "u-1",
      }),
    ).rejects.toMatchObject({ code: "PROMO_MINIMUM" });
  });

  it("throws PROMO_NOT_APPLICABLE for scoped promos on other services", async () => {
    const applicable = ["st-9"];
    const sql = promoSql([{}], 0, applicable);
    await expect(
      resolvePromo(sql, {
        code: "SAVE20",
        serviceTypeId: "st-1",
        orderAmount: 100,
        userId: "u-1",
      }),
    ).rejects.toMatchObject({ code: "PROMO_NOT_APPLICABLE" });
  });

  it("throws PROMO_USED once per-user limit is hit", async () => {
    const sql = promoSql([{}], 1);
    await expect(
      resolvePromo(sql, {
        code: "SAVE20",
        serviceTypeId: "st-1",
        orderAmount: 100,
        userId: "u-1",
      }),
    ).rejects.toMatchObject({ code: "PROMO_USED" });
  });
});