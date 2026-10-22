import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://u:p@localhost/db";
  process.env.ANTHROPIC_API_KEY = "test";
  process.env.VOYAGE_API_KEY = "test";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test";
  process.env.BLOB_READ_WRITE_TOKEN = "test";
});

import { EMBEDDING_DIMS, embedText } from "./embed";

const respond = (body: unknown, status = 200) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

describe("embedText", () => {
  afterEach(() => vi.unstubAllGlobals());
  vi.spyOn(console, "warn").mockImplementation(() => {});

  it("returns the 512-dim vector", async () => {
    respond({ data: [{ embedding: Array(EMBEDDING_DIMS).fill(0.1) }] });
    expect(await embedText("garbage near hostel 4")).toHaveLength(EMBEDDING_DIMS);
  });

  it("returns null on HTTP errors, wrong dimensions or network failure", async () => {
    respond({ error: "rate limited" }, 429);
    expect(await embedText("x")).toBeNull();
    respond({ data: [{ embedding: [1, 2, 3] }] });
    expect(await embedText("x")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await embedText("x")).toBeNull();
  });
});
