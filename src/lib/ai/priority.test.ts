import { describe, expect, it } from "vitest";
import { computePriority, WEIGHTS } from "./priority";

const now = new Date("2026-10-22T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const base = { safetyRisk: 1, severity: 1, communityImpact: 1, relatedCount: 0, createdAt: now, now };

describe("computePriority", () => {
  it("weights sum to 1", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("scores the minimum case 0 and the maximum case 100", () => {
    expect(computePriority(base).score).toBe(0);
    const max = { safetyRisk: 5, severity: 5, communityImpact: 5, relatedCount: 5, createdAt: hoursAgo(72), now };
    expect(computePriority(max).score).toBe(100);
  });

  it("returns one breakdown row per factor whose contributions sum to the score", () => {
    const { score, breakdown } = computePriority({ ...base, safetyRisk: 4, severity: 3, relatedCount: 2, createdAt: hoursAgo(10) });
    expect(breakdown.map((f) => f.factor)).toEqual(["safety", "severity", "related", "waiting", "community"]);
    expect(breakdown.reduce((s, f) => s + f.contribution, 0)).toBeCloseTo(score, 0);
  });

  it("makes safety the strongest single factor", () => {
    expect(computePriority({ ...base, safetyRisk: 5 }).score).toBe(35);
    expect(computePriority({ ...base, severity: 5 }).score).toBe(25);
  });

  it("saturates related reports and waiting time", () => {
    expect(computePriority({ ...base, relatedCount: 50 }).score).toBe(20);
    expect(computePriority({ ...base, createdAt: hoursAgo(500) }).score).toBe(10);
    expect(computePriority({ ...base, createdAt: hoursAgo(36) }).score).toBe(5);
  });

  it("clamps out-of-range inputs", () => {
    expect(computePriority({ ...base, safetyRisk: 9, createdAt: hoursAgo(-5) }).score).toBe(35);
  });
});
