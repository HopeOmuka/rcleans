// Applies scripts/migrate-*.sql against PostgreSQL (Neon) using the
// DATABASE_URL from .env (or the environment). Each file is idempotent.
//
// Usage:
//   node scripts/run-migrations.mjs                 # run all pending migrations
//   node scripts/run-migrations.mjs <file> [...     # run specific files
//   node scripts/run-migrations.mjs --verify        # verify applied schema only
//
// Never prints the connection string.

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const SCRIPTS = join(ROOT, "scripts");

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    for (const line of readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      if (line.startsWith("DATABASE_URL=")) {
        return line.slice("DATABASE_URL=".length).trim();
      }
    }
  } catch {}
  throw new Error("DATABASE_URL not found in .env or environment");
}

function verifyQueries() {
  return [
    ["services.recurrence", "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'recurrence'"],
    ["services.recurring_parent_id", "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'recurring_parent_id'"],
    ["cleaners.password_hash", "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'cleaners' AND column_name = 'password_hash'"],
    ["chat_typing", "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_name = 'chat_typing'"],
    ["support_replies", "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_name = 'support_replies'"],
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args[0] === "--verify";

  const client = new pg.Client({ connectionString: loadDatabaseUrl() });
  await client.connect();

  try {
    if (verifyOnly) {
      for (const [label, sql] of verifyQueries()) {
        const { rows } = await client.query(sql);
        const ok = Number(rows[0].n) === 1;
        console.log(`${ok ? "OK  " : "MISS"} ${label}`);
      }
      return;
    }

    let files;
    if (args.length > 0) {
      files = args.map((a) => resolve(a));
    } else {
      files = readdirSync(SCRIPTS)
        .filter((f) => f.startsWith("migrate-") && f.endsWith(".sql"))
        .sort()
        .map((f) => join(SCRIPTS, f));
    }

    for (const file of files) {
      const sql = readFileSync(file, "utf8");
      const name = file.split(/[\\/]/).pop();
      try {
        await client.query(sql);
        console.log(`applied ${name}`);
      } catch (err) {
        console.error(`FAILED ${name}: ${err instanceof Error ? err.message : err}`);
        process.exitCode = 1;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});