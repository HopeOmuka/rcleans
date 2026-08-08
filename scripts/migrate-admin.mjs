import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "omukahope@gmail.com";

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
  `;
  console.log("is_admin column ensured");

  const result = await sql`
    UPDATE users SET is_admin = true WHERE email = ${ADMIN_EMAIL} RETURNING id, name, email, is_admin
  `;
  if (result.length === 0) {
    console.error(`No user found with email ${ADMIN_EMAIL}`);
    process.exit(1);
  }
  console.log("Admin flagged:", JSON.stringify(result[0], null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
