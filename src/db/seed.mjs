import postgres from "postgres";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const email    = process.env.SEED_EMAIL    ?? "lab@my-repair.it";
const password = process.env.SEED_PASSWORD ?? "demo1234";
const shopName = "Laboratorio Demo";

console.log("🌱 Seeding...");

// Verifica se l'utente esiste già
const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
if (existing) {
  console.log(`ℹ️  Utente ${email} già presente. Nessuna modifica.`);
  await sql.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);
const userId  = randomUUID();
const orgId   = randomUUID();
const storeId = randomUUID();
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

await sql`
  INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
  VALUES (${userId}, ${email}, ${"Admin Demo"}, ${passwordHash}, NOW(), NOW())
`;

await sql`
  INSERT INTO organizations (id, name, slug, plan, subscription_status, trial_ends_at, created_at, updated_at)
  VALUES (
    ${orgId}, ${shopName}, ${"laboratorio-demo"},
    ${"solo"}::plan, ${"trial"}::subscription_status,
    ${trialEndsAt}, NOW(), NOW()
  )
`;

await sql`
  INSERT INTO memberships (user_id, organization_id, role, created_at)
  VALUES (${userId}, ${orgId}, ${"owner"}::role, NOW())
`;

await sql`
  INSERT INTO stores (id, organization_id, name, is_default, created_at, updated_at)
  VALUES (${storeId}, ${orgId}, ${shopName}, true, NOW(), NOW())
`;

console.log("✅ Seed completato!");
console.log(`   Email:    ${email}`);
console.log(`   Password: ${password}`);
await sql.end();
