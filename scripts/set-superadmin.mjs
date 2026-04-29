import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf-8").split("\n")) {
    const [k, ...rest] = line.split("=");
    if (k && rest.length && !process.env[k.trim()]) {
      process.env[k.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL non impostata");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const postgres = (await import("postgres")).default;

const sql = postgres(DATABASE_URL, { max: 1 });
const ADMIN_EMAIL = "admin@my-repair.it";
const TEMP_PASSWORD = "ChangeMe2024!";

async function main() {
  const existing = await sql`SELECT id, is_super_admin FROM users WHERE email = ${ADMIN_EMAIL}`;

  if (existing.length > 0) {
    const user = existing[0];
    if (!user.is_super_admin) {
      await sql`UPDATE users SET is_super_admin = true, updated_at = NOW() WHERE id = ${user.id}`;
      console.log(`✓ ${ADMIN_EMAIL} impostato come super admin`);
    } else {
      console.log(`✓ ${ADMIN_EMAIL} è già super admin`);
    }
    console.log(`  → Accedi su /login con email: ${ADMIN_EMAIL}`);
    console.log(`  → Poi vai su /admin`);
  } else {
    const hash = await bcrypt.hash(TEMP_PASSWORD, 12);
    const rows = await sql`
      INSERT INTO users (email, name, password_hash, is_super_admin, created_at, updated_at)
      VALUES (${ADMIN_EMAIL}, 'Super Admin', ${hash}, true, NOW(), NOW())
      RETURNING id
    `;
    console.log(`✓ Utente super admin creato: ${ADMIN_EMAIL} (id: ${rows[0].id})`);
    console.log(`  Password temporanea: ${TEMP_PASSWORD}`);
    console.log(`  ⚠️  CAMBIA LA PASSWORD al primo accesso da /settings`);
  }

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
