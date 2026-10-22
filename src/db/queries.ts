import { and, asc, cosineDistance, eq, gte, ne, sql } from "drizzle-orm";
import type { AuditEntry, Complaint, LngLat } from "@/types";
import { db } from "./client";
import { toEwkt } from "./geography";
import { auditLog, complaints, type AuditLogRow, type ComplaintRow, type NewComplaintRow } from "./schema";

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

export type NearbyComplaint = {
  id: string;
  createdAt: Date;
  duplicateOf: string | null;
  distanceM: number;
  similarity: number | null;
};

/**
 * Complaints within `radiusM` metres of `location` created in the last `days` days, oldest first.
 * Uses ST_DWithin on geography (metres, GIST-indexed). With an embedding, also returns cosine
 * similarity (1 − pgvector `<=>` distance) so dedup can threshold it; rows without embeddings get null.
 */
export async function findNearby(opts: {
  location: LngLat;
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
        sql`ST_DWithin(${complaints.location}, ${point}, ${opts.radiusM})`,
        gte(complaints.createdAt, sql`now() - make_interval(days => ${opts.days})`),
        opts.excludeId ? ne(complaints.id, opts.excludeId) : undefined,
      ),
    )
    .orderBy(asc(complaints.createdAt));
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
