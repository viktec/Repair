import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });

const email = process.env.SEED_EMAIL ?? "admin@my-repair.it";
const password = process.env.SEED_PASSWORD ?? "password123";
const shopName = "Laboratorio Demo";

console.log("🌱 Seeding database...");

const passwordHash = await bcrypt.hash(password, 12);

const [user] = await db
  .insert(schema.users)
  .values({ email, name: "Admin Demo", passwordHash })
  .onConflictDoNothing()
  .returning({ id: schema.users.id });

if (!user) {
  console.log("ℹ️  User already exists, skipping.");
  await sql.end();
  process.exit(0);
}

const [org] = await db
  .insert(schema.organizations)
  .values({
    name: shopName,
    slug: "laboratorio-demo",
    plan: "start",
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  })
  .returning({ id: schema.organizations.id });

await db.insert(schema.memberships).values({
  userId: user.id,
  organizationId: org.id,
  role: "owner",
});

await db.insert(schema.stores).values({
  organizationId: org.id,
  name: shopName,
  isDefault: true,
});

console.log(`✅ Seed complete — email: ${email} / password: ${password}`);
await sql.end();
