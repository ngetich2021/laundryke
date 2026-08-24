import "dotenv/config";
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = createClient({ url, authToken });
const migrationsDir = join(process.cwd(), "prisma", "migrations");

await client.execute(`
  CREATE TABLE IF NOT EXISTS _turso_sync_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const applied = await client.execute("SELECT name FROM _turso_sync_migrations");
const appliedNames = new Set(applied.rows.map((r) => r.name));

const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function stripSql(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("--") && !line.trim().startsWith("/*") && line.trim() !== "*/")
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

let ranAny = false;
for (const folder of migrationFolders) {
  if (appliedNames.has(folder)) continue;
  const sqlPath = join(migrationsDir, folder, "migration.sql");
  if (!existsSync(sqlPath)) continue;

  console.log(`Applying ${folder}...`);
  const statements = stripSql(readFileSync(sqlPath, "utf-8"));
  for (const statement of statements) {
    await client.execute(statement);
  }
  await client.execute({
    sql: "INSERT INTO _turso_sync_migrations (name) VALUES (?)",
    args: [folder],
  });
  ranAny = true;
  console.log(`Applied ${folder}.`);
}

if (!ranAny) console.log("Turso is already up to date.");
client.close();
