import { and, asc, eq, inArray } from "drizzle-orm";
import { buildStatusHistory } from "@/lib/report-history";
import type { ReporterView } from "@/types";
import { db } from "./client";
import { auditLog, complaints, departments } from "./schema";

/**
 * Reporter-safe views of the given complaints (newest first) with their status history. Only ids the
 * reporter's device remembered are looked up; contact details and AI internals never leave the server.
 */
export async function getReporterViews(ids: string[]): Promise<ReporterView[]> {
  if (ids.length === 0) return [];
  const [rows, audits] = await Promise.all([
    db
      .select({
        id: complaints.id,
        title: complaints.title,
        category: complaints.category,
        status: complaints.status,
        priorityScore: complaints.priorityScore,
        locationLabel: complaints.locationLabel,
        duplicateOf: complaints.duplicateOf,
        createdAt: complaints.createdAt,
        resolvedAt: complaints.resolvedAt,
        departmentName: departments.name,
      })
      .from(complaints)
      .leftJoin(departments, eq(departments.id, complaints.departmentId))
      .where(inArray(complaints.id, ids)),
    db
      .select({ complaintId: auditLog.complaintId, action: auditLog.action, after: auditLog.after, createdAt: auditLog.createdAt })
      .from(auditLog)
      .where(and(inArray(auditLog.complaintId, ids), inArray(auditLog.action, ["ai_analysis", "status_change"])))
      .orderBy(asc(auditLog.createdAt)),
  ]);

  return rows
    .map((r) => {
      const entries = audits
        .filter((a) => a.complaintId === r.id)
        .map((a) => ({ action: a.action, after: a.after as Record<string, unknown> | null, createdAt: a.createdAt.toISOString() }));
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
        history: buildStatusHistory(r.createdAt.toISOString(), entries),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
