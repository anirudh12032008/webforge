import { findNearby, type NearbyComplaint } from "@/db/queries";
import type { LngLat } from "@/types";

/** Cosine similarity above this means "same issue": link to the original instead of a new ticket. */
export const DUPLICATE_THRESHOLD = 0.82;
/** Similarity from here up to DUPLICATE_THRESHOLD means "probably related": shown, not merged. */
export const RELATED_THRESHOLD = 0.65;
export const DEDUP_RADIUS_M = 75;
export const DEDUP_WINDOW_DAYS = 14;

export type DedupResult = { duplicateOf: string | null; relatedIds: string[] };

/**
 * Splits nearby candidates (oldest first) by embedding similarity. The earliest candidate above
 * DUPLICATE_THRESHOLD becomes `duplicateOf`; if it is itself a duplicate we follow it to its
 * original so chains never form. Candidates in [RELATED_THRESHOLD, DUPLICATE_THRESHOLD] are related.
 */
export function decideDuplicates(candidates: NearbyComplaint[]): DedupResult {
  const scored = candidates.filter((c): c is NearbyComplaint & { similarity: number } => c.similarity !== null);
  const original = scored.find((c) => c.similarity > DUPLICATE_THRESHOLD);
  const relatedIds = scored
    .filter((c) => c.similarity >= RELATED_THRESHOLD && c.similarity <= DUPLICATE_THRESHOLD)
    .map((c) => c.id);
  return { duplicateOf: original ? (original.duplicateOf ?? original.id) : null, relatedIds };
}

/**
 * Looks for earlier reports of the same issue: same org, within 75 m, last 14 days, compared by
 * meaning (pgvector cosine). Without an embedding (Voyage down) dedup is skipped, never guessed.
 */
export async function findDuplicates(opts: {
  location: LngLat;
  orgId: number;
  embedding: number[] | null;
  excludeId: string;
}): Promise<DedupResult> {
  if (!opts.embedding) return { duplicateOf: null, relatedIds: [] };
  const candidates = await findNearby({
    location: opts.location,
    orgId: opts.orgId,
    radiusM: DEDUP_RADIUS_M,
    days: DEDUP_WINDOW_DAYS,
    embedding: opts.embedding,
    excludeId: opts.excludeId,
  });
  return decideDuplicates(candidates);
}
