import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireUserAuth, rateLimit, clientIp } from "@/lib/server-auth";
import { resolvePromo } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const auth = await requireUserAuth(request);
    await rateLimit(`promo:validate:${auth.userId}`, 120, 60_000);
    await rateLimit(`promo:validate:ip:${clientIp(request)}`, 600, 60_000);

    const body = await request.json();
    const { code, serviceTypeId, orderAmount } = body;

    if (!code || !orderAmount) {
      throw new AppError(
        400,
        "Promo code and order amount required",
        "VALIDATION_ERROR",
      );
    }

    const parsedAmount = Number(orderAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError(400, "Invalid order amount", "VALIDATION_ERROR");
    }

    if (typeof code !== "string") {
      throw new AppError(400, "Invalid promo code", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Validation only - usage is counted atomically when the booking is created.
    const promo = await resolvePromo(sql, {
      code: code.trim().toUpperCase(),
      serviceTypeId,
      orderAmount: parsedAmount,
      userId: auth.userId,
    });

    return jsonResponse({
      data: {
        promoCode: { code: promo.code, id: promo.promoId },
        discountAmount: promo.discountAmount,
        finalAmount: parsedAmount - promo.discountAmount,
        originalAmount: parsedAmount,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error validating promo code");
  }
}
