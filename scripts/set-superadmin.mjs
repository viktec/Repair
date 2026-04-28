/**
 * Imposta admin@my-repair.it come super admin.
 * Eseguire sul VPS nella directory del progetto:
 *   node scripts/set-superadmin.mjs
 *
 * Richiede DATABASE_URL nel processo (letto da .env se presente).
 */

import { readFileSync, existsSync } from "fs";

// Carica .env se presente
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

// bcryptjs è una dipendenza del progetto
const { createRequire } = await import("module");
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: DATABASE_URL });
const ADMIN_EMAIL = "admin@my-repair.it";
const TEMP_PASSWORD = "ChangeMe2024!";

async function main() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query(
      "SELECT id, is_super_admin FROM users WHERE email = $1",
      [ADMIN_EMAIL],
    );

    if (existing.length > 0) {
      const user = existing[0];
      if (!user.is_super_admin) {
        await client.query(
          "UPDATE users SET is_super_admin = true, updated_at = NOW() WHERE id = $1",
          [user.id],
        );
        console.log(`✓ ${ADMIN_EMAIL} impostato come super admin`);
      } else {
        console.log(`✓ ${ADMIN_EMAIL} è già super admin`);
      }
      console.log(`  → Accedi su /login con email: ${ADMIN_EMAIL}`);
      console.log(`  → Poi vai su /admin`);
    } else {
      const hash = await bcrypt.hash(TEMP_PASSWORD, 12);
      const { rows } = await client.query(
        `INSERT INTO users (email, name, password_hash, is_super_admin, created_at, updated_at)
         VALUES ($1, 'Super Admin', $2, true, NOW(), NOW())
         RETURNING id`,
        [ADMIN_EMAIL, hash],
      );
      console.log(`✓ Utente super admin creato: ${ADMIN_EMAIL} (id: ${rows[0].id})`);
      console.log(`  Password temporanea: ${TEMP_PASSWORD}`);
      console.log(`  ⚠️  CAMBIA LA PASSWORD al primo accesso da /settings`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
