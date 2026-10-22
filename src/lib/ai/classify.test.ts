import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://u:p@localhost/db";
  process.env.ANTHROPIC_API_KEY = "test";
  process.env.VOYAGE_API_KEY = "test";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test";
  process.env.BLOB_READ_WRITE_TOKEN = "test";
});

import { FALLBACK_CLASSIFICATION, normalizeClassification } from "./classify";

describe("normalizeClassification", () => {
  it("clamps ratings to 1–5 integers and confidence to 0–1", () => {
    const c = normalizeClassification({
      category: "pothole",
      confidence: 1.4,
      severity: 7,
      safetyRisk: 0,
      communityImpact: 3.6,
      reasoning: "  Deep pothole\n on the main road.  ",
      suggestedTitle: "  Deep pothole on main road ",
      summary: "A deep pothole on the main road. ",
    });
    expect(c).toEqual({
      category: "pothole",
      confidence: 1,
      severity: 5,
      safetyRisk: 1,
      communityImpact: 4,
      reasoning: "Deep pothole on the main road.",
      suggestedTitle: "Deep pothole on main road",
      summary: "A deep pothole on the main road.",
      usedFallback: false,
    });
  });

  it("marks the fallback so the UI can flag it for manual review", () => {
    expect(FALLBACK_CLASSIFICATION).toMatchObject({ category: "other", confidence: 0.3, usedFallback: true });
  });
});
