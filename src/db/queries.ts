import { and, asc, cosineDistance, eq, gt, gte, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import type { AuditEntry, Complaint, LngLat, Org } from "@/types";
import { db } from "./client";
import { toEwkt } from "./geography";
import { auditLog, complaints, orgs, type AuditLogRow, type ComplaintRow, type NewComplaintRow } from "./schema";

/** Inserts a complaint and returns the stored row (with generated id and timestamps). */
export async function insertComplaint(values: NewComplaintRow): Promise<ComplaintRow> {
  const [row] = await db.insert(complaints).values(values).returning();
  return row;
}

/** Applies a partial update; returns null when the id doesn't exist. */
export async function updateComplaint(id: string, patch: Partial<NewComplaintRow>): Promise<ComplaintRow | null> {
  const [row] = await db.update(complaints).set(patch).where(eq(complaints.id, id)).returning();
  return row ?? null;
}

export async function getComplaint(id: string): Promise<ComplaintRow | null> {
  const [row] = await db.select().from(complaints).where(eq(complaints.id, id));
  return row ?? null;
}

/**
 * Orgs that may handle a complaint at `location`: those whose boundary covers the point (ST_Covers)
 * plus boundary-less orgs such as the city. Most specific first, so a campus pin defaults to campus.
 */
export async function findEligibleOrgs(location: LngLat): Promise<Org[]> {
  const point = sql`${toEwkt(location)}::geography`;
  return db
    .select({ id: orgs.id, slug: orgs.slug, name: orgs.name, kind: orgs.kind })
    .from(orgs)
    .where(or(isNull(orgs.boundary), sql`ST_Covers(${orgs.boundary}, ${point})`))
    .orderBy(sql`${orgs.boundary} IS NULL`, asc(orgs.id));
}

export type NearbyComplaint = {
  id: string;
  createdAt: Date;
  duplicateOf: string | null;
  distanceM: number;
  similarity: number | null;
};

/**
 * Complaints in the same org within `radiusM` metres of `location` created in the last `days` days, oldest first.
 * Uses ST_DWithin on geography (metres, GIST-indexed). With an embedding, also returns cosine
 * similarity (1 − pgvector `<=>` distance) so dedup can threshold it; rows without embeddings get null.
 */
export async function findNearby(opts: {
  location: LngLat;
  orgId: number;
  radiusM: number;
  days: number;
  embedding?: number[] | null;
  excludeId?: string;
}): Promise<NearbyComplaint[]> {
  const point = sql`${toEwkt(opts.location)}::geography`;
  const similarity = opts.embedding
    ? sql<number | null>`1 - (${cosineDistance(complaints.embedding, opts.embedding)})`.mapWith(Number)
    : sql<null>`null`;
  return db
    .select({
      id: complaints.id,
      createdAt: complaints.createdAt,
      duplicateOf: complaints.duplicateOf,
      distanceM: sql<number>`ST_Distance(${complaints.location}, ${point})`.mapWith(Number),
      similarity,
    })
    .from(complaints)
    .where(
      and(
        eq(complaints.orgId, opts.orgId),
        sql`ST_DWithin(${complaints.location}, ${point}, ${opts.radiusM})`,
        gte(complaints.createdAt, sql`now() - make_interval(days => ${opts.days})`),
        opts.excludeId ? ne(complaints.id, opts.excludeId) : undefined,
      ),
    )
    .orderBy(asc(complaints.createdAt));
}

/** Adds one to a complaint's related-report count (another duplicate landed on it). */
export async function incrementRelatedCount(id: string): Promise<ComplaintRow | null> {
  const [row] = await db
    .update(complaints)
    .set({ relatedCount: sql`${complaints.relatedCount} + 1` })
    .where(eq(complaints.id, id))
    .returning();
  return row ?? null;
}

/** 1-based position of `score` among the org's open, non-duplicate complaints (1 = most urgent). */
export async function getOpenRank(orgId: number, score: number): Promise<number> {
  const [row] = await db
    .select({ ahead: sql<number>`count(*)`.mapWith(Number) })
    .from(complaints)
    .where(
      and(
        eq(complaints.orgId, orgId),
        notInArray(complaints.status, ["resolved", "rejected"]),
        isNull(complaints.duplicateOf),
        gt(complaints.priorityScore, score),
      ),
    );
  return (row?.ahead ?? 0) + 1;
}

/** Appends one audit entry; `before`/`after` hold only the fields that changed. */
export async function writeAudit(entry: {
  complaintId: string;
  actor: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  await db.insert(auditLog).values({ before: null, after: null, ...entry });
}

/** Maps a DB row to the API shape: drops the embedding, serialises dates as ISO strings. */
export function toApiComplaint(row: ComplaintRow): Complaint {
  const { embedding, createdAt, updatedAt, resolvedAt, ...rest } = row;
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    resolvedAt: resolvedAt?.toISOString() ?? null,
  };
}

/** Maps an audit row to the API shape. */
export function toApiAudit(row: AuditLogRow): AuditEntry {
  return {
    ...row,
    before: (row.before as Record<string, unknown> | null) ?? null,
    after: (row.after as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
