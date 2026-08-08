import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_payment_status_check
`;

await sql`
  ALTER TABLE services
  ADD CONSTRAINT services_payment_status_check
  CHECK (payment_status IN ('pending', 'authorized', 'paid', 'refunded', 'failed'))
`;

console.log("payment_status now allows: pending|authorized|paid|refunded|failed");