import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { getComplaint, toApiComplaint, updateComplaint, writeAudit } from "@/db/queries";
import { complaints, type ComplaintRow } from "@/db/schema";
import { computePriority } from "@/lib/ai/priority";
import { errorResponse, validationError } from "@/lib/http";
import { checkMerge } from "@/lib/merge";
import { mergeSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
const idSchema = z.uuid();

const actorOf = (request: Request) => request.headers.get("x-actor")?.trim().slice(0, 80) || "admin";

/** Sets a report's linked-report count and re-scores it so the queue reflects the change. */
async function rescore(row: ComplaintRow, relatedCount: number): Promise<void> {
  const { score, breakdown } = computePriority({
    safetyRisk: row.safetyRisk ?? 3,
    severity: row.severity ?? 3,
    communityImpact: row.communityImpact ?? 3,
    relatedCount,
    createdAt: row.createdAt,
  });
  await updateComplaint(row.id, { relatedCount, priorityScore: score, priorityBreakdown: breakdown });
}

/** Admin merge: marks complaint [id] as a duplicate of `into`'s root original and audits both sides. */
export async function POST(request: Request, { params }: Params) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return errorResponse("Unknown complaint", 404);
  const parsed = mergeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const [source, target] = await Promise.all([getComplaint(id.data), getComplaint(parsed.data.into)]);
  if (!source || !target) return errorResponse("Unknown complaint", 404);
  const [{ pointing }] = await db.select({ pointing: count() }).from(complaints).where(eq(complaints.duplicateOf, source.id));
  const check = checkMerge(source, target, pointing > 0);
  if (!check.ok) return errorResponse(check.error, 422);

  const root = check.rootId === target.id ? target : await getComplaint(check.rootId);
  if (!root) return errorResponse("Unknown complaint", 404);
  const updated = await updateComplaint(source.id, { duplicateOf: root.id });
  await rescore(root, root.relatedCount + 1);
  const actor = actorOf(request);
  await Promise.all([
    writeAudit({ complaintId: source.id, actor, action: "merge", before: { duplicateOf: null }, after: { duplicateOf: root.id } }),
    writeAudit({ complaintId: root.id, actor, action: "merge", before: { relatedCount: root.relatedCount }, after: { relatedCount: root.relatedCount + 1, merged: source.id } }),
  ]);
  return NextResponse.json({ complaint: updated && toApiComplaint(updated) });
}

/** Admin unmerge: detaches complaint [id] from its original, which drops one linked report. */
export async function DELETE(request: Request, { params }: Params) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return errorResponse("Unknown complaint", 404);
  const source = await getComplaint(id.data);
  if (!source) return errorResponse("Unknown complaint", 404);
  if (!source.duplicateOf) return errorResponse("This report isn't merged into another one.", 422);

  const original = await getComplaint(source.duplicateOf);
  const updated = await updateComplaint(source.id, { duplicateOf: null });
  const actor = actorOf(request);
  const audits = [writeAudit({ complaintId: source.id, actor, action: "unmerge", before: { duplicateOf: source.duplicateOf }, after: { duplicateOf: null } })];
  if (original) {
    const relatedCount = Math.max(0, original.relatedCount - 1);
    await rescore(original, relatedCount);
    audits.push(writeAudit({ complaintId: original.id, actor, action: "unmerge", before: { relatedCount: original.relatedCount }, after: { relatedCount, unmerged: source.id } }));
  }
  await Promise.all(audits);
  return NextResponse.json({ complaint: updated && toApiComplaint(updated) });
}
