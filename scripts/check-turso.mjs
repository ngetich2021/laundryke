import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  const r = await client.execute("select name from sqlite_master where type='table'");
  console.log("existing tables:", r.rows.map((x) => x.name));
} catch (e) {
  console.error("ERR", e.message);
  process.exitCode = 1;
} finally {
  client.close();
}
