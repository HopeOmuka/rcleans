import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// service_type_ids: empty array = available for all service types; otherwise
// only the listed service type ids can offer this add-on.
await sql`
  ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS service_type_ids TEXT[] NOT NULL DEFAULT '{}'
`;

const scopeByAddonName = {
  "Inside Fridge": ["deep-cleaning"],
  "Inside Oven": ["deep-cleaning"],
  "Window Cleaning": ["home-cleaning", "office-cleaning", "deep-cleaning", "post-construction"],
  "Carpet Shampoo": ["home-cleaning", "office-cleaning"],
  "Laundry Service": ["home-cleaning"],
};

for (const [name, ids] of Object.entries(scopeByAddonName)) {
  await sql`
    UPDATE service_addons
    SET service_type_ids = ${ids}
    WHERE name = ${name}
  `;
}

const rows = await sql`SELECT name, service_type_ids FROM service_addons ORDER BY sort_order`;
console.table(rows);

console.log("service_addons.service_type_ids migration applied");