import { existsSync, readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const seedSchema = z.object({
  org: z.string(),
  title: z.string(),
  description: z.string(),
  lat: z.number(),
  lng: z.number(),
  locationLabel: z.string().optional(),
  photoUrl: z.string().url().nullish(),
  reporterName: z.string().optional(),
  daysAgo: z.number().min(0).default(0),
  /** Demo only: mark resolved this many hours after it was reported (feeds resolution-time analytics). */
  resolvedAfterHours: z.number().positive().optional(),
});
type Seed = z.infer<typeof seedSchema>;

// Fallback demo set: realistic Bhopal + MANIT issues, incl. near-duplicate pairs and a recurring hotspot.
const DEMO: Seed[] = [
  { org: "manit", title: "Open manhole near Hostel 7 gate", description: "Manhole cover outside Hostel 7 main gate is missing. A student tripped into it last night, the area is very dark.", lat: 23.2167, lng: 77.4075, locationLabel: "Hostel 7 gate, MANIT", daysAgo: 4 },
  { org: "manit", title: "Garbage piling behind canteen", description: "Food waste and plastic bags have been piling up behind the main canteen for 3 days. Stray dogs are tearing the bags open and it smells.", lat: 23.2152, lng: 77.4088, locationLabel: "Main canteen, MANIT", daysAgo: 3 },
  { org: "manit", title: "Canteen dustbins overflowing", description: "Bins behind the canteen are overflowing, waste spilling onto the path. Dogs everywhere.", lat: 23.21525, lng: 77.40885, locationLabel: "Main canteen, MANIT", daysAgo: 2 },
  { org: "manit", title: "Water pipe burst near library", description: "A pipe has burst on the left side of the central library, water is flowing onto the road continuously since morning.", lat: 23.2159, lng: 77.4049, locationLabel: "Central library, MANIT", daysAgo: 1 },
  { org: "manit", title: "Exposed wires on lamp post at sports complex", description: "The junction box on the lamp post next to the basketball court is open and wires are hanging out at knee height. Kids play here in the evening.", lat: 23.2141, lng: 77.4071, locationLabel: "Sports complex, MANIT", daysAgo: 0 },
  { org: "manit", title: "Streetlights off on road to Hostel 10", description: "All 4 streetlights between the library and Hostel 10 have been off for a week. Pitch dark at night.", lat: 23.2178, lng: 77.4062, locationLabel: "Road to Hostel 10, MANIT", daysAgo: 6, resolvedAfterHours: 40 },
  { org: "manit", title: "Washroom blocked in Academic Block B", description: "Ground floor boys washroom in Block B is blocked and overflowing onto the corridor floor.", lat: 23.2183, lng: 77.4086, locationLabel: "Academic Block B, MANIT", daysAgo: 1 },
  { org: "manit", title: "Pothole at main gate entrance", description: "Large pothole right at the main gate entrance where buses turn in. Two-wheelers keep swerving around it.", lat: 23.2134, lng: 77.4103, locationLabel: "Main gate, MANIT", daysAgo: 9, resolvedAfterHours: 52 },
  { org: "bmc", title: "Huge pothole on MP Nagar Zone 1 road", description: "Deep pothole in the middle of the road near the Zone 1 bus stop, filled with water so you can't see it. Bikes have fallen twice this week.", lat: 23.2332, lng: 77.4343, locationLabel: "MP Nagar Zone 1", daysAgo: 5 },
  { org: "bmc", title: "Dangerous pothole near Zone 1 bus stop", description: "There's a big water-filled pothole near the MP Nagar Zone 1 bus stop, a scooter rider fell into it yesterday.", lat: 23.23325, lng: 77.43435, locationLabel: "MP Nagar Zone 1", daysAgo: 2 },
  { org: "bmc", title: "Garbage dump at New Market corner", description: "Shops are dumping waste at the corner near the New Market parking. It's been there for a week and blocks half the lane.", lat: 23.2337, lng: 77.4006, locationLabel: "New Market, Bhopal", daysAgo: 7, resolvedAfterHours: 20 },
  { org: "bmc", title: "Streetlights not working on VIP Road", description: "A stretch of about 500 m on VIP Road along Upper Lake has no working streetlights. Very unsafe for walkers at night.", lat: 23.2589, lng: 77.3889, locationLabel: "VIP Road, Upper Lake", daysAgo: 3 },
  { org: "bmc", title: "Sewage overflowing on Kolar Road", description: "The drain near Kolar Road petrol pump is overflowing with sewage onto the road. Terrible smell and mosquitoes.", lat: 23.1855, lng: 77.4145, locationLabel: "Kolar Road", daysAgo: 4, resolvedAfterHours: 26 },
  { org: "bmc", title: "Leaking water main near Bittan Market", description: "Clean water has been gushing from a broken pipeline near Bittan Market for two days. Lots of water being wasted.", lat: 23.2128, lng: 77.4304, locationLabel: "Bittan Market", daysAgo: 2 },
  { org: "bmc", title: "Sparking transformer in Shahpura", description: "The transformer near Shahpura lake park is sparking and making loud noises in the evening. People are scared to walk past.", lat: 23.2003, lng: 77.4282, locationLabel: "Shahpura", daysAgo: 0 },
  { org: "bmc", title: "Broken footpath near Rani Kamlapati station", description: "Footpath tiles are broken and missing outside the station exit, elderly passengers keep tripping.", lat: 23.2213, lng: 77.4381, locationLabel: "Rani Kamlapati station", daysAgo: 11, resolvedAfterHours: 30 },
];

function loadSeeds(): Seed[] {
  const path = "data/seed-complaints.json";
  return existsSync(path) ? z.array(seedSchema).parse(JSON.parse(readFileSync(path, "utf8"))) : DEMO;
}

/**
 * Resolves seeds that declare resolvedAfterHours, through the same status + audit path an admin
 * override uses, so analytics has real resolution times. Matches by title within the seed's org.
 */
async function resolveSeeds(seeds: Seed[]) {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../src/db/client");
  const { complaints, orgs } = await import("../src/db/schema");
  const { updateComplaint, writeAudit } = await import("../src/db/queries");

  for (const seed of seeds.filter((s) => s.resolvedAfterHours)) {
    const [row] = await db
      .select({ id: complaints.id, status: complaints.status, createdAt: complaints.createdAt })
      .from(complaints)
      .innerJoin(orgs, eq(orgs.id, complaints.orgId))
      .where(and(eq(complaints.title, seed.title), eq(orgs.slug, seed.org), isNull(complaints.duplicateOf)));
    if (!row || row.status === "resolved") continue;
    const resolvedAt = new Date(row.createdAt.getTime() + (seed.resolvedAfterHours ?? 0) * 3_600_000);
    await updateComplaint(row.id, { status: "resolved", resolvedAt });
    await writeAudit({ complaintId: row.id, actor: "demo-seed", action: "status_change", before: { status: row.status }, after: { status: "resolved" } });
    console.log(`resolved after ${seed.resolvedAfterHours} h: ${seed.title}`);
  }
}

/**
 * Pushes each seed through the real intake pipeline (Claude, Voyage, dedup, routing), oldest first so
 * duplicates link to the earlier report, then backdates created_at and re-scores so waiting time counts.
 */
async function main() {
  const { submitComplaint } = await import("../src/lib/ai/pipeline");
  const { getComplaint, updateComplaint } = await import("../src/db/queries");
  const { computePriority } = await import("../src/lib/ai/priority");

  const seeds = loadSeeds().sort((a, b) => b.daysAgo - a.daysAgo);
  if (process.argv.includes("--resolve-only")) return resolveSeeds(seeds);
  // Voyage's free tier allows 3 requests/min; SEED_DELAY_MS=0 once a payment method lifts the limit.
  const delayMs = Number(process.env.SEED_DELAY_MS ?? 21_000);
  for (const [i, seed] of seeds.entries()) {
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const { complaint, analysis } = await submitComplaint({
        title: seed.title,
        description: seed.description,
        location: { lat: seed.lat, lng: seed.lng },
        locationLabel: seed.locationLabel ?? null,
        photoUrl: seed.photoUrl ?? null,
        reporterName: seed.reporterName ?? null,
        reporterContact: null,
        orgSlug: seed.org,
      });
      const createdAt = new Date(Date.now() - seed.daysAgo * 86_400_000 - Math.random() * 6 * 3_600_000);
      const row = await getComplaint(complaint.id);
      if (row) {
        const { score, breakdown } = computePriority({
          safetyRisk: row.safetyRisk ?? 3,
          severity: row.severity ?? 3,
          communityImpact: row.communityImpact ?? 3,
          relatedCount: row.relatedCount,
          createdAt,
        });
        await updateComplaint(row.id, { createdAt, priorityScore: score, priorityBreakdown: breakdown });
      }
      const dup = analysis.duplicateOf ? ` → duplicate of ${analysis.duplicateOf.slice(0, 8)}` : "";
      console.log(`${i + 1}/${seeds.length} ${analysis.classification.category.padEnd(11)} ${seed.title}${dup}`);
    } catch (err) {
      console.error(`${i + 1}/${seeds.length} FAILED ${seed.title}:`, err instanceof Error ? err.message : err);
    }
  }
  await resolveSeeds(seeds);
}

main().then(() => process.exit(0));
