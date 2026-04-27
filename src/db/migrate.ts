import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

await migrate(db, {
  migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
});

console.log("✅ Migration complete");
await sql.end();
