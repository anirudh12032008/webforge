import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://u:p@localhost/db";
  process.env.ANTHROPIC_API_KEY = "test";
  process.env.VOYAGE_API_KEY = "test";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test";
});

import { isRecurring, RECURRING_MIN_REPORTS } from "./clusters";

describe("isRecurring", () => {
  it("flags hotspots with at least 3 reports in the recent window", () => {
    expect(RECURRING_MIN_REPORTS).toBe(3);
    expect(isRecurring(2)).toBe(false);
    expect(isRecurring(3)).toBe(true);
  });
});
