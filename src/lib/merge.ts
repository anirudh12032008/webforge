type MergeNode = { id: string; orgId: number; duplicateOf: string | null };

export type MergeCheck = { ok: true; rootId: string } | { ok: false; error: string };

/**
 * Validates an admin merge of `source` into `target`. The target is resolved to its root original
 * (duplicates always point at the root, so one hop is enough) to keep chains from forming.
 * Rejects self-merges, cross-org merges, re-merges, and sources that other reports already point at.
 */
export function checkMerge(source: MergeNode, target: MergeNode, sourceHasDuplicates: boolean): MergeCheck {
  const rootId = target.duplicateOf ?? target.id;
  if (rootId === source.id) return { ok: false, error: "A report can't be merged into itself." };
  if (source.orgId !== target.orgId) return { ok: false, error: "Only reports handled by the same organisation can be merged." };
  if (source.duplicateOf) return { ok: false, error: "This report is already merged. Unmerge it first." };
  if (sourceHasDuplicates) {
    return { ok: false, error: "Other reports are merged into this one. Merge them elsewhere or merge the other way round." };
  }
  return { ok: true, rootId };
}
