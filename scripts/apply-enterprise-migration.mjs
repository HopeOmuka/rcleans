import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const statements = [
  // Audit trail for Stripe payments on services
  `ALTER TABLE services ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`,
  // Per-user promo redemption limit
  `ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1`,
  // One-time redemption ledger (promo_code, user) -> UNIQUE enforces 1 use/user
  `CREATE TABLE IF NOT EXISTS promo_redemptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    promo_code_id TEXT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (promo_code_id, user_id)
  )`,
];

for (const statement of statements) {
  try {
    await sql.query(statement);
    console.log("OK:", statement.split("\n")[0].slice(0, 70));
  } catch (error) {
    console.error("FAILED:", statement.slice(0, 70), "-", error.message);
    process.exitCode = 1;
  }
}
