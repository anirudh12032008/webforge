import { getDepartmentsWithLoad } from "@/db/departments";
import {
  findEligibleOrgs,
  getOpenRank,
  incrementRelatedCount,
  insertComplaint,
  toApiComplaint,
  updateComplaint,
  writeAudit,
} from "@/db/queries";
import type { ComplaintRow } from "@/db/schema";
import type { CreateComplaintInput } from "@/lib/validation";
import type { Analysis, Complaint, Locale } from "@/types";
import { classifyComplaint } from "./classify";
import { findDuplicates } from "./dedup";
import { embedText } from "./embed";
import { computePriority } from "./priority";
import { chooseDepartment } from "./route";

/** The chosen org doesn't cover the pinned location (or nothing does). */
export class OrgNotEligibleError extends Error {}

/** Re-scores an original report after another duplicate lands on it, so repeats push it up the queue. */
async function reprioritize(row: ComplaintRow): Promise<void> {
  const { score, breakdown } = computePriority({
    safetyRisk: row.safetyRisk ?? 3,
    severity: row.severity ?? 3,
    communityImpact: row.communityImpact ?? 3,
    relatedCount: row.relatedCount,
    createdAt: row.createdAt,
  });
  await updateComplaint(row.id, { priorityScore: score, priorityBreakdown: breakdown });
}

/**
 * Intake pipeline: resolve org → insert → classify ∥ embed → dedup → priority → route → update →
 * audit. The row is stored first so a report is never lost; AI steps degrade gracefully (fallback
 * category, skipped dedup). Only an org that doesn't cover the location is rejected.
 */
export async function submitComplaint(input: CreateComplaintInput, locale: Locale = "en"): Promise<{ complaint: Complaint; analysis: Analysis }> {
  const eligible = await findEligibleOrgs(input.location);
  const org = input.orgSlug ? eligible.find((o) => o.slug === input.orgSlug) : eligible[0];
  if (!org) throw new OrgNotEligibleError(input.orgSlug ? `${input.orgSlug} doesn't cover this location` : "No organisation covers this location");

  const row = await insertComplaint({
    title: input.title ?? "Photo report",
    description: input.description ?? "",
    photoUrl: input.photoUrl ?? null,
    location: input.location,
    locationLabel: input.locationLabel ?? null,
    reporterName: input.reporterName ?? null,
    reporterContact: input.reporterContact ?? null,
    orgId: org.id,
  });

  // With text we embed in parallel with classification; a photo-only report embeds the AI's summary.
  const [classification, textEmbedding] = await Promise.all([
    classifyComplaint(input),
    input.description ? embedText(`${input.title ?? ""}\n${input.description}`) : Promise.resolve(null),
  ]);
  const title = input.title ?? classification.suggestedTitle;
  const description = input.description ?? classification.summary;
  const embedding = textEmbedding ?? (description ? await embedText(`${title}\n${description}`) : null);
  const dedup = await findDuplicates({ location: input.location, orgId: org.id, embedding, excludeId: row.id });
  const relatedCount = dedup.relatedIds.length + (dedup.duplicateOf ? 1 : 0);
  const priority = computePriority({
    safetyRisk: classification.safetyRisk,
    severity: classification.severity,
    communityImpact: classification.communityImpact,
    relatedCount,
    createdAt: row.createdAt,
  });
  const routing = chooseDepartment(classification, await getDepartmentsWithLoad(org.id), locale);

  const analysisFields = {
    title,
    description,
    category: classification.category,
    categoryConfidence: classification.confidence,
    severity: classification.severity,
    safetyRisk: classification.safetyRisk,
    communityImpact: classification.communityImpact,
    aiReasoning: classification.reasoning,
    priorityScore: priority.score,
    priorityBreakdown: priority.breakdown,
    departmentId: routing.department?.id ?? null,
    duplicateOf: dedup.duplicateOf,
    relatedCount,
    embedding,
    status: "triaged" as const,
  };
  const updated = (await updateComplaint(row.id, analysisFields)) ?? row;

  if (dedup.duplicateOf) {
    const original = await incrementRelatedCount(dedup.duplicateOf);
    if (original) await reprioritize(original);
  }
  const { embedding: _vector, priorityBreakdown: _breakdown, description: _text, ...audited } = analysisFields;
  const [rank] = await Promise.all([
    getOpenRank(org.id, priority.score),
    writeAudit({
      complaintId: row.id,
      actor: "ai",
      action: "ai_analysis",
      after: { ...audited, relatedIds: dedup.relatedIds, usedFallback: classification.usedFallback, embedded: embedding !== null },
    }),
  ]);

  return {
    complaint: toApiComplaint(updated),
    analysis: {
      classification,
      duplicateOf: dedup.duplicateOf,
      relatedIds: dedup.relatedIds,
      priority: { score: priority.score, rank, breakdown: priority.breakdown },
      department: routing.department,
      routingReason: routing.reason,
    },
  };
}
