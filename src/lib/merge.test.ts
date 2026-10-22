import { describe, expect, it } from "vitest";
import { checkMerge } from "./merge";

const node = (id: string, duplicateOf: string | null = null, orgId = 1) => ({ id, orgId, duplicateOf });

describe("checkMerge", () => {
  it("merges into the target's root original", () => {
    expect(checkMerge(node("a"), node("b"), false)).toEqual({ ok: true, rootId: "b" });
    expect(checkMerge(node("a"), node("c", "root"), false)).toEqual({ ok: true, rootId: "root" });
  });

  it("rejects self-merge, including via the target's root", () => {
    expect(checkMerge(node("a"), node("a"), false).ok).toBe(false);
    expect(checkMerge(node("a"), node("b", "a"), false).ok).toBe(false);
  });

  it("rejects cross-org, already-merged and sources with their own duplicates", () => {
    expect(checkMerge(node("a"), node("b", null, 2), false).ok).toBe(false);
    expect(checkMerge(node("a", "x"), node("b"), false).ok).toBe(false);
    expect(checkMerge(node("a"), node("b"), true).ok).toBe(false);
  });
});
