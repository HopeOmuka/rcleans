import { neon } from "@neondatabase/serverless";
import { jsonResponse, errorResponse, AppError } from "@/lib/api-error";
import { requireAdminAuth } from "@/lib/admin-auth";

const ACTIONS = [
  "approve",
  "reject",
  "activate",
  "deactivate",
  "set_available",
  "set_unavailable",
] as const;

export async function GET(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);

    if (!id) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT
        id, first_name, last_name, email, phone,
        profile_image_url, rating, total_ratings,
        completed_jobs, years_experience, is_available, is_active,
        background_check_status, insurance_status, specialties, bio,
        created_at
      FROM cleaners
      WHERE id = ${id}
    `;
    if (rows.length === 0) {
      throw new AppError(404, "Cleaner not found", "NOT_FOUND");
    }

    const [earnings] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed' AND payment_status = 'paid')::int AS paid_jobs,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'completed' AND payment_status = 'paid'), 0)::float8 AS gross,
        COALESCE(AVG(r.rating) FILTER (WHERE s.completed_at IS NOT NULL), 0)::float8 AS avg_rating
      FROM services s
      LEFT JOIN service_ratings r ON r.service_id = s.id
      WHERE s.cleaner_id = ${id}
    `;

    const recent = await sql`
      SELECT
        s.id, s.status, s.payment_status, s.total_price,
        s.created_at, s.scheduled_date,
        st.name AS service_type_name
      FROM services s
      INNER JOIN service_types st ON s.service_type_id = st.id
      WHERE s.cleaner_id = ${id}
      ORDER BY s.created_at DESC
      LIMIT 20
    `;

    const cleaner = rows[0];
    return jsonResponse({
      data: {
        ...cleaner,
        rating: Number(cleaner.rating),
        total_ratings: Number(cleaner.total_ratings),
        completed_jobs: Number(cleaner.completed_jobs),
        years_experience: Number(cleaner.years_experience),
        earnings: {
          paid_jobs: Number(earnings.paid_jobs),
          gross: Number(earnings.gross),
          avg_rating: Number(earnings.avg_rating),
        },
        recent: recent.map((r) => ({
          ...r,
          total_price: Number(r.total_price),
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error fetching cleaner");
  }
}

export async function POST(request: Request, { id }: { id?: string } = {}) {
  try {
    await requireAdminAuth(request);
    const body = await request.json();
    const { action } = body;

    if (!id) {
      throw new AppError(400, "Cleaner ID required", "VALIDATION_ERROR");
    }
    if (!ACTIONS.includes(action)) {
      throw new AppError(
        400,
        `Invalid action. Must be one of: ${ACTIONS.join(", ")}`,
        "VALIDATION_ERROR",
      );
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    let result;
    if (action === "approve") {
      result = await sql`
        UPDATE cleaners
        SET background_check_status = 'approved',
            insurance_status = 'approved',
            is_active = true,
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, background_check_status, insurance_status
      `;
    } else if (action === "reject") {
      result = await sql`
        UPDATE cleaners
        SET background_check_status = 'rejected',
            insurance_status = 'rejected',
            is_active = false,
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, background_check_status, insurance_status
      `;
    } else if (action === "activate") {
      result = await sql`
        UPDATE cleaners
        SET is_active = true, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, background_check_status, insurance_status
      `;
    } else if (action === "set_available") {
      result = await sql`
        UPDATE cleaners
        SET is_available = true, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, is_available, background_check_status, insurance_status
      `;
    } else if (action === "set_unavailable") {
      result = await sql`
        UPDATE cleaners
        SET is_available = false, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, is_available, background_check_status, insurance_status
      `;
    } else {
      result = await sql`
        UPDATE cleaners
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, first_name, last_name, is_active, background_check_status, insurance_status
      `;
    }

    if (result.length === 0) {
      throw new AppError(404, "Cleaner not found", "NOT_FOUND");
    }

    return jsonResponse({ data: result[0] });
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error);
    return errorResponse(error, "Error updating cleaner");
  }
}
