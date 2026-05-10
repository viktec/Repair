// Deletes activity_log entries older than RETENTION_DAYS (default 365).
// Usage: node /app/cleanup.mjs [days]
// VPS cron example: 0 3 1 * * docker compose exec -T app node /app/cleanup.mjs

import postgres from "postgres";

const RETENTION_DAYS = parseInt(process.argv[2] ?? "365", 10);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const result = await sql`
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '1 day' * ${RETENTION_DAYS}
  RETURNING id
`;

console.log(`✅ Cleanup: deleted ${result.length} activity log entries older than ${RETENTION_DAYS} days`);

await sql.end();
