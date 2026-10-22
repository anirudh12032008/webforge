import { NextResponse } from "next/server";
import { getComplaint, updateComplaint, writeAudit } from "@/db/queries";
import type { NewComplaintRow } from "@/db/schema";
import { validationError } from "@/lib/http";
import { AUDIT_ACTIONS, diffOverride, resolvedAtFor } from "@/lib/overrides";
import { bulkStatusSchema } from "@/lib/validation";
import type { Status } from "@/types";

/**
 * Applies one status to a complaint with the same rules as the single PATCH: no-ops are skipped,
 * resolved_at follows the status, and the change is audited. Returns whether anything changed.
 */
async function applyStatus(id: string, status: Status, actor: string): Promise<boolean> {
  const row = await getComplaint(id);
  if (!row) return false;
  const [change] = diffOverride(row, { status });
  if (!change) return false;

  const update: Partial<NewComplaintRow> = { status };
  const resolvedAt = resolvedAtFor(row.status, status);
  if (resolvedAt !== undefined) update.resolvedAt = resolvedAt;
  await updateComplaint(id, update);
  await writeAudit({ complaintId: id, actor, action: AUDIT_ACTIONS.status, before: { status: row.status }, after: { status } });
  return true;
}

/** Bulk status change from the triage table; every changed complaint gets its own audit entry. */
export async function POST(request: Request) {
  const parsed = bulkStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Send 1–100 complaint ids and a status");

  const actor = request.headers.get("x-actor")?.trim().slice(0, 80) || "admin";
  const results = await Promise.all(parsed.data.ids.map((id) => applyStatus(id, parsed.data.status, actor)));
  return NextResponse.json({ updated: results.filter(Boolean).length });
}
