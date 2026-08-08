import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS push_tokens (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id text,
    cleaner_id text,
    token text NOT NULL UNIQUE,
    platform text NOT NULL DEFAULT 'unknown',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT push_tokens_owner_check CHECK (user_id IS NOT NULL OR cleaner_id IS NOT NULL)
  );
`;

await sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_cleaner ON push_tokens(cleaner_id)`;

console.log("push_tokens table ensured");
process.exit(0);