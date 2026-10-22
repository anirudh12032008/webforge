import { NextResponse } from "next/server";
import { z } from "zod";
import { getComplaintDetail } from "@/db/complaint-detail";
import { getComplaint, toApiComplaint, updateComplaint, writeAudit } from "@/db/queries";
import type { NewComplaintRow } from "@/db/schema";
import { errorResponse, validationError } from "@/lib/http";
import { AUDIT_ACTIONS, diffOverride, resolvedAtFor } from "@/lib/overrides";
import { patchComplaintSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
const idSchema = z.uuid();

/** Complaint with org, department, linked reports and audit trail. */
export async function GET(_request: Request, { params }: Params) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return errorResponse("Unknown complaint", 404);
  const detail = await getComplaintDetail(id.data);
  return detail ? NextResponse.json(detail) : errorResponse("Unknown complaint", 404);
}

/**
 * Admin override of status, category or team. Only real changes are applied, each one written to the
 * audit log with before/after and the actor from the x-actor header.
 */
export async function PATCH(request: Request, { params }: Params) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return errorResponse("Unknown complaint", 404);
  const parsed = patchComplaintSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const row = await getComplaint(id.data);
  if (!row) return errorResponse("Unknown complaint", 404);
  if (parsed.data.departmentId) {
    const detail = await getComplaintDetail(id.data);
    if (!detail?.orgDepartments.some((d) => d.id === parsed.data.departmentId)) {
      return errorResponse("That team doesn't belong to this complaint's organisation.", 422);
    }
  }

  const changes = diffOverride(row, parsed.data);
  if (changes.length === 0) return NextResponse.json({ complaint: toApiComplaint(row) });

  const update: Partial<NewComplaintRow> = Object.fromEntries(changes.map((c) => [c.field, c.after]));
  const statusChange = changes.find((c) => c.field === "status");
  if (statusChange) {
    const resolvedAt = resolvedAtFor(row.status, update.status ?? row.status);
    if (resolvedAt !== undefined) update.resolvedAt = resolvedAt;
  }

  const updated = await updateComplaint(id.data, update);
  if (!updated) return errorResponse("Unknown complaint", 404);
  const actor = request.headers.get("x-actor")?.trim().slice(0, 80) || "admin";
  await Promise.all(
    changes.map((c) =>
      writeAudit({ complaintId: id.data, actor, action: AUDIT_ACTIONS[c.field], before: { [c.field]: c.before }, after: { [c.field]: c.after } }),
    ),
  );
  return NextResponse.json({ complaint: toApiComplaint(updated) });
}
