// drizzle-kit quotes types missing from its built-in list, emitting "geography(Point, 4326)",
// which Postgres rejects. Run after `drizzle-kit generate` to unquote it in every migration.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "drizzle";
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
  const path = join(dir, file);
  const sql = readFileSync(path, "utf8");
  const fixed = sql.replaceAll(/"geography\(([^)]*)\)"/g, "geography($1)");
  if (fixed !== sql) {
    writeFileSync(path, fixed);
    console.log(`unquoted geography in ${file}`);
  }
}
