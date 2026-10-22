import { asc, desc, eq, inArray } from "drizzle-orm";
import { DEDUP_RADIUS_M, DUPLICATE_THRESHOLD, RELATED_THRESHOLD } from "@/lib/ai/dedup";
import type { AuditEntry, Complaint, Department, Org, Status } from "@/types";
import { db } from "./client";
import { findNearby, getComplaint, toApiAudit, toApiComplaint } from "./queries";
import { auditLog, complaints, departments, orgs } from "./schema";

export type LinkedReport = { id: string; title: string; status: Status; createdAt: string; similarity?: number };

export type ComplaintDetail = {
  complaint: Complaint;
  org: Org;
  department: Department | null;
  orgDepartments: Department[];
  duplicates: LinkedReport[];
  related: LinkedReport[];
  audit: AuditEntry[];
};

/** Window for showing related reports on the detail page (wider than dedup's 14 days). */
const RELATED_WINDOW_DAYS = 30;

/**
 * Everything the admin detail page needs in one call. Duplicates are rows pointing at this one via
 * duplicate_of; related reports are recomputed live (same org, ≤75 m, similarity in the related band)
 * so the list stays right after merges or overrides.
 */
export async function getComplaintDetail(id: string): Promise<ComplaintDetail | null> {
  const row = await getComplaint(id);
  if (!row) return null;

  const [[org], orgDepartments, duplicateRows, auditRows, nearby] = await Promise.all([
    db.select({ id: orgs.id, slug: orgs.slug, name: orgs.name, kind: orgs.kind }).from(orgs).where(eq(orgs.id, row.orgId)),
    db.select().from(departments).where(eq(departments.orgId, row.orgId)).orderBy(asc(departments.name)),
    db
      .select({ id: complaints.id, title: complaints.title, status: complaints.status, createdAt: complaints.createdAt })
      .from(complaints)
      .where(eq(complaints.duplicateOf, id))
      .orderBy(asc(complaints.createdAt)),
    db.select().from(auditLog).where(eq(auditLog.complaintId, id)).orderBy(desc(auditLog.createdAt)),
    row.embedding
      ? findNearby({ location: row.location, orgId: row.orgId, radiusM: DEDUP_RADIUS_M, days: RELATED_WINDOW_DAYS, embedding: row.embedding, excludeId: id })
      : Promise.resolve([]),
  ]);

  const relatedScores = new Map(
    nearby
      .filter((n) => n.similarity !== null && n.similarity >= RELATED_THRESHOLD && n.similarity <= DUPLICATE_THRESHOLD && n.duplicateOf !== id)
      .map((n) => [n.id, n.similarity ?? 0]),
  );
  const relatedRows = relatedScores.size
    ? await db
        .select({ id: complaints.id, title: complaints.title, status: complaints.status, createdAt: complaints.createdAt })
        .from(complaints)
        .where(inArray(complaints.id, [...relatedScores.keys()]))
    : [];

  const toLinked = (r: { id: string; title: string; status: Status; createdAt: Date }): LinkedReport => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    similarity: relatedScores.get(r.id),
  });

  return {
    complaint: toApiComplaint(row),
    org,
    department: orgDepartments.find((d) => d.id === row.departmentId) ?? null,
    orgDepartments,
    duplicates: duplicateRows.map(toLinked),
    related: relatedRows.map(toLinked).sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)),
    audit: auditRows.map(toApiAudit),
  };
}
