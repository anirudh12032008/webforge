import { existsSync, readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { CATEGORIES, ORG_KINDS } from "../src/types";

loadEnvConfig(process.cwd());

const orgSchema = z.object({
  slug: z.string(),
  name: z.string(),
  kind: z.enum(ORG_KINDS),
  boundary: z.array(z.tuple([z.number(), z.number()])).min(4).optional(),
});
const departmentSchema = z.object({
  org: z.string(),
  slug: z.string(),
  name: z.string(),
  categories: z.array(z.enum(CATEGORIES)).min(1),
  capacity: z.number().int().positive(),
});

const geoJsonPolygonSchema = z.object({
  features: z.array(z.object({ geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))) }) })).min(1),
});

/** Outer ring of the campus outline traced by the team (GeoJSON), or a rough box if it's missing. */
function campusBoundary(): [number, number][] {
  const path = ["data/manit-campus.geojson", "Manit campus.geojson"].find(existsSync);
  if (!path) return [[77.399, 23.209], [77.416, 23.209], [77.416, 23.224], [77.399, 23.224], [77.399, 23.209]];
  return geoJsonPolygonSchema.parse(JSON.parse(readFileSync(path, "utf8"))).features[0].geometry.coordinates[0];
}

const DEFAULT_ORGS: z.infer<typeof orgSchema>[] = [
  { slug: "bmc", name: "Bhopal Municipal Corporation", kind: "city" },
  { slug: "manit", name: "MANIT Bhopal Campus", kind: "campus", boundary: campusBoundary() },
];

const DEFAULT_DEPARTMENTS: z.infer<typeof departmentSchema>[] = [
  { org: "manit", slug: "manit-civil", name: "MANIT Estate Office (Civil)", categories: ["pothole", "water_leak", "other"], capacity: 15 },
  { org: "manit", slug: "manit-electrical", name: "MANIT Electrical Maintenance", categories: ["streetlight", "electrical"], capacity: 10 },
  { org: "manit", slug: "manit-housekeeping", name: "MANIT Housekeeping", categories: ["garbage", "sanitation"], capacity: 12 },
  { org: "bmc", slug: "bmc-roads", name: "BMC Roads & Public Works", categories: ["pothole", "other"], capacity: 40 },
  { org: "bmc", slug: "bmc-swm", name: "BMC Solid Waste Management", categories: ["garbage"], capacity: 40 },
  { org: "bmc", slug: "bmc-water", name: "BMC Water Supply", categories: ["water_leak"], capacity: 30 },
  { org: "bmc", slug: "bmc-lighting", name: "BMC Street Lighting", categories: ["streetlight", "electrical"], capacity: 25 },
  { org: "bmc", slug: "bmc-health", name: "BMC Health & Sanitation", categories: ["sanitation"], capacity: 30 },
];

/** Reads a teammate-owned JSON file from data/ if present, else falls back to the defaults above. */
function load<T>(file: string, schema: z.ZodType<T>, fallback: T[]): T[] {
  const path = `data/${file}`;
  if (!existsSync(path)) return fallback;
  return z.array(schema).parse(JSON.parse(readFileSync(path, "utf8")));
}

const toPolygonEwkt = (ring: [number, number][]) => `SRID=4326;POLYGON((${ring.map(([lng, lat]) => `${lng} ${lat}`).join(", ")}))`;

/**
 * Upserts orgs and departments (by slug) so re-running is safe. Complaint seeding through the real
 * AI pipeline comes next, once teammates' data/seed-complaints.json exists.
 */
async function main() {
  // Imported after env is loaded: client.ts validates env at import time.
  const { db } = await import("../src/db/client");
  const { departments, orgs } = await import("../src/db/schema");

  const orgRows = load("orgs.json", orgSchema, DEFAULT_ORGS);
  const orgIds = new Map<string, number>();
  for (const org of orgRows) {
    const boundary = org.boundary ? toPolygonEwkt(org.boundary) : null;
    const [row] = await db
      .insert(orgs)
      .values({ slug: org.slug, name: org.name, kind: org.kind, boundary })
      .onConflictDoUpdate({ target: orgs.slug, set: { name: org.name, kind: org.kind, boundary } })
      .returning({ id: orgs.id });
    orgIds.set(org.slug, row.id);
  }

  const deptRows = load("departments.json", departmentSchema, DEFAULT_DEPARTMENTS);
  for (const dept of deptRows) {
    const orgId = orgIds.get(dept.org);
    if (!orgId) throw new Error(`Department ${dept.slug} references unknown org "${dept.org}"`);
    const values = { orgId, name: dept.name, categories: dept.categories, capacity: dept.capacity };
    await db.insert(departments).values({ slug: dept.slug, ...values }).onConflictDoUpdate({ target: departments.slug, set: values });
  }

  const [counts] = await db.execute<{ orgs: number; departments: number }>(
    sql`select (select count(*) from orgs)::int as orgs, (select count(*) from departments)::int as departments`,
  ).then((r) => r.rows);
  console.log(`Seeded: ${counts.orgs} orgs, ${counts.departments} departments`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
