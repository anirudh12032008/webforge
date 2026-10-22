import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://u:p@localhost/db";
  process.env.ANTHROPIC_API_KEY = "test";
  process.env.VOYAGE_API_KEY = "test";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test";
  process.env.BLOB_READ_WRITE_TOKEN = "test";
});

import { decideDuplicates, findDuplicates } from "./dedup";

const candidate = (id: string, similarity: number | null, duplicateOf: string | null = null) => ({
  id,
  similarity,
  duplicateOf,
  createdAt: new Date("2026-10-20T10:00:00Z"),
  distanceM: 20,
});

describe("decideDuplicates", () => {
  it("links to the earliest strong match and lists medium matches as related", () => {
    const result = decideDuplicates([
      candidate("a", 0.7),
      candidate("b", 0.9),
      candidate("c", 0.95),
      candidate("d", 0.5),
    ]);
    expect(result).toEqual({ duplicateOf: "b", relatedIds: ["a"] });
  });

  it("follows a duplicate to its original so chains never form", () => {
    expect(decideDuplicates([candidate("b", 0.9, "root")]).duplicateOf).toBe("root");
  });

  it("treats the thresholds as exclusive for duplicates and inclusive for related", () => {
    expect(decideDuplicates([candidate("x", 0.82), candidate("y", 0.65)])).toEqual({
      duplicateOf: null,
      relatedIds: ["x", "y"],
    });
  });

  it("ignores candidates without embeddings", () => {
    expect(decideDuplicates([candidate("n", null)])).toEqual({ duplicateOf: null, relatedIds: [] });
  });
});

describe("findDuplicates", () => {
  it("skips the database entirely when there is no embedding", async () => {
    const result = await findDuplicates({ location: { lng: 77.4, lat: 23.2 }, orgId: 1, embedding: null, excludeId: "z" });
    expect(result).toEqual({ duplicateOf: null, relatedIds: [] });
  });
});
