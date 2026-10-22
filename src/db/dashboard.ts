import { and, asc, count, desc, eq, isNull, notInArray, sql, type SQL } from "drizzle-orm";
import type { ListComplaintsQuery } from "@/lib/validation";
import type { ComplaintListItem, DashboardStats, MapPoint } from "@/types";
import { db } from "./client";
import { complaints, departments, orgs } from "./schema";

const CLOSED: ("resolved" | "rejected")[] = ["resolved", "rejected"];
/** Hours after which an open complaint breaches the SLA. */
export const SLA_HOURS = 72;

/** WHERE clauses shared by the table, map and stats: org/status/category/department/bbox filters. */
function filters(q: Partial<ListComplaintsQuery>): SQL | undefined {
  return and(
    isNull(complaints.duplicateOf),
    q.org ? eq(orgs.slug, q.org) : undefined,
    q.status ? eq(complaints.status, q.status) : undefined,
    q.category ? eq(complaints.category, q.category) : undefined,
    q.department ? eq(complaints.departmentId, q.department) : undefined,
    q.bbox
      ? sql`${complaints.location}::geometry && ST_MakeEnvelope(${q.bbox.minLng}, ${q.bbox.minLat}, ${q.bbox.maxLng}, ${q.bbox.maxLat}, 4326)`
      : undefined,
  );
}

const SORTS = {
  priority: [desc(complaints.priorityScore), asc(complaints.createdAt)],
  newest: [desc(complaints.createdAt)],
  oldest: [asc(complaints.createdAt)],
} as const;

/**
 * One page of original (non-duplicate) complaints for the triage table, joined with department and
 * org names. Duplicates are folded into their original's relatedCount rather than listed.
 */
export async function listComplaints(q: ListComplaintsQuery): Promise<{ items: ComplaintListItem[]; total: number }> {
  const where = filters(q);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: complaints.id,
        title: complaints.title,
        locationLabel: complaints.locationLabel,
        location: complaints.location,
        category: complaints.category,
        categoryConfidence: complaints.categoryConfidence,
        safetyRisk: complaints.safetyRisk,
        priorityScore: complaints.priorityScore,
        status: complaints.status,
        relatedCount: complaints.relatedCount,
        createdAt: complaints.createdAt,
        departmentName: departments.name,
        orgSlug: orgs.slug,
        orgName: orgs.name,
      })
      .from(complaints)
      .innerJoin(orgs, eq(orgs.id, complaints.orgId))
      .leftJoin(departments, eq(departments.id, complaints.departmentId))
      .where(where)
      .orderBy(...SORTS[q.sort])
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize),
    db.select({ total: count() }).from(complaints).innerJoin(orgs, eq(orgs.id, complaints.orgId)).where(where),
  ]);
  return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total };
}

/** Open complaints as map markers (capped at 500, highest priority first). */
export async function listMapPoints(org?: string): Promise<MapPoint[]> {
  return db
    .select({
      id: complaints.id,
      title: complaints.title,
      location: complaints.location,
      category: complaints.category,
      priorityScore: complaints.priorityScore,
      status: complaints.status,
    })
    .from(complaints)
    .innerJoin(orgs, eq(orgs.id, complaints.orgId))
    .where(and(filters({ org }), notInArray(complaints.status, CLOSED)))
    .orderBy(desc(complaints.priorityScore))
    .limit(500);
}

/** Headline counts in one round-trip: open, urgent (safety ≥ 4), SLA-overdue and merged duplicates. */
export async function getDashboardStats(org?: string): Promise<DashboardStats> {
  const open = sql`${complaints.status} NOT IN ('resolved', 'rejected')`;
  const [row] = await db
    .select({
      open: sql<number>`count(*) filter (where ${open} and ${complaints.duplicateOf} is null)`.mapWith(Number),
      urgent: sql<number>`count(*) filter (where ${open} and ${complaints.duplicateOf} is null and ${complaints.safetyRisk} >= 4)`.mapWith(Number),
      overdue: sql<number>`count(*) filter (where ${open} and ${complaints.duplicateOf} is null and ${complaints.createdAt} < now() - make_interval(hours => ${SLA_HOURS}))`.mapWith(Number),
      linkedDuplicates: sql<number>`count(*) filter (where ${complaints.duplicateOf} is not null)`.mapWith(Number),
    })
    .from(complaints)
    .innerJoin(orgs, eq(orgs.id, complaints.orgId))
    .where(org ? eq(orgs.slug, org) : undefined);
  return row;
}
