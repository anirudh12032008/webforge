import type { PriorityFactor } from "@/types";

/** Factor weights; they sum to 1 so the score lands on 0–100. */
export const WEIGHTS = {
  safety: 0.35,
  severity: 0.25,
  related: 0.2,
  waiting: 0.1,
  community: 0.1,
} as const satisfies Record<PriorityFactor["factor"], number>;

/** Waiting time at which the factor maxes out; matches the 72 h SLA. */
export const WAITING_SATURATION_HOURS = 72;
/** Related-report count at which the factor maxes out (6th report adds no more urgency). */
export const RELATED_SATURATION = 5;

export type PriorityInput = {
  safetyRisk: number;
  severity: number;
  communityImpact: number;
  relatedCount: number;
  createdAt: Date;
  now?: Date;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const fromScale = (v: number) => clamp01((v - 1) / 4); // 1–5 → 0–1
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Explainable priority: each factor is normalised to 0–1, multiplied by its weight and scaled to
 * 100, and the contributions are summed. 1–5 ratings map linearly; related reports and waiting
 * hours grow linearly until they saturate, so no single factor can dominate the others.
 */
export function computePriority(input: PriorityInput): { score: number; breakdown: PriorityFactor[] } {
  const hoursWaiting = ((input.now ?? new Date()).getTime() - input.createdAt.getTime()) / 3_600_000;
  const factors: [PriorityFactor["factor"], number, number][] = [
    ["safety", input.safetyRisk, fromScale(input.safetyRisk)],
    ["severity", input.severity, fromScale(input.severity)],
    ["related", input.relatedCount, clamp01(input.relatedCount / RELATED_SATURATION)],
    ["waiting", round1(Math.max(0, hoursWaiting)), clamp01(hoursWaiting / WAITING_SATURATION_HOURS)],
    ["community", input.communityImpact, fromScale(input.communityImpact)],
  ];

  const breakdown = factors.map(([factor, raw, normalized]) => ({
    factor,
    weight: WEIGHTS[factor],
    raw,
    normalized: round1(normalized * 100) / 100,
    contribution: round1(WEIGHTS[factor] * normalized * 100),
  }));
  const score = round1(breakdown.reduce((sum, f) => sum + f.contribution, 0));
  return { score: Math.min(100, score), breakdown };
}
