import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const sql = neon(`${process.env.DATABASE_URL}`);
    const rows = await sql`
      SELECT id, code, description, discount_type, discount_value,
        minimum_order_amount, maximum_discount_amount, usage_limit, usage_count,
        valid_from, valid_until, is_active, max_uses_per_user, created_at
      FROM promo_codes
      ORDER BY created_at DESC
    `;
    const data = rows.map((r) => ({
      ...r,
      discount_value: Number(r.discount_value),
      minimum_order_amount: Number(r.minimum_order_amount),
      maximum_discount_amount:
        r.maximum_discount_amount !== null
          ? Number(r.maximum_discount_amount)
          : null,
      usage_limit: r.usage_limit !== null ? Number(r.usage_limit) : null,
      usage_count: Number(r.usage_count),
      max_uses_per_user: Number(r.max_uses_per_user),
    }));
    return jsonResponse({ data });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching promo codes");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      valid_until,
      max_uses_per_user,
    } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      throw new AppError(400, "Code is required", "VALIDATION_ERROR");
    }
    if (discount_type !== "percentage" && discount_type !== "fixed_amount") {
      throw new AppError(
        400,
        "discount_type must be percentage or fixed_amount",
        "VALIDATION_ERROR",
      );
    }
    const parsedValue = Number(discount_value);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      throw new AppError(400, "Invalid discount value", "VALIDATION_ERROR");
    }
    if (discount_type === "percentage" && parsedValue > 100) {
      throw new AppError(
        400,
        "Percentage cannot exceed 100",
        "VALIDATION_ERROR",
      );
    }
    const minAmount = Number(minimum_order_amount ?? 0);
    if (isNaN(minAmount) || minAmount < 0) {
      throw new AppError(
        400,
        "Invalid minimum order amount",
        "VALIDATION_ERROR",
      );
    }
    const maxUses = Number(max_uses_per_user ?? 1);
    if (isNaN(maxUses) || maxUses < 1) {
      throw new AppError(400, "Invalid max uses per user", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const normalizedCode = code.trim().toUpperCase();

    const [existing] = await sql`
      SELECT id FROM promo_codes WHERE code = ${normalizedCode}
    `;
    if (existing) {
      throw new AppError(400, "Promo code already exists", "VALIDATION_ERROR");
    }

    const [row] = await sql`
      INSERT INTO promo_codes (code, description, discount_type, discount_value, minimum_order_amount, valid_until, max_uses_per_user)
      VALUES (
        ${normalizedCode},
        ${description?.trim() ?? ""},
        ${discount_type},
        ${parsedValue},
        ${minAmount},
        ${valid_until ? new Date(valid_until) : null},
        ${maxUses}
      )
      RETURNING id, code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active, max_uses_per_user
    `;
    const data = {
      ...row,
      discount_value: Number(row.discount_value),
      minimum_order_amount: Number(row.minimum_order_amount),
      maximum_discount_amount:
        row.maximum_discount_amount !== null
          ? Number(row.maximum_discount_amount)
          : null,
      usage_limit: row.usage_limit !== null ? Number(row.usage_limit) : null,
      usage_count: Number(row.usage_count),
      max_uses_per_user: Number(row.max_uses_per_user),
    };
    return jsonResponse({ data }, 201);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error creating promo code");
  }
}
