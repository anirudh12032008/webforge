import { describe, expect, it } from "vitest";
import { diffOverride, resolvedAtFor } from "./overrides";

const current = { status: "triaged" as const, category: "pothole" as const, departmentId: 1 };

describe("diffOverride", () => {
  it("drops fields that don't change", () => {
    expect(diffOverride(current, { category: "pothole", departmentId: 1 })).toEqual([]);
  });

  it("records category and status changes with before/after", () => {
    expect(diffOverride(current, { category: "sanitation", status: "in_progress" })).toEqual([
      { field: "category", before: "pothole", after: "sanitation" },
      { field: "status", before: "triaged", after: "in_progress" },
    ]);
  });

  it("moves a triaged complaint to assigned when a team is assigned", () => {
    expect(diffOverride(current, { departmentId: 2 })).toEqual([
      { field: "departmentId", before: 1, after: 2 },
      { field: "status", before: "triaged", after: "assigned" },
    ]);
  });

  it("keeps an explicit status and doesn't auto-assign past triage", () => {
    expect(diffOverride(current, { departmentId: 2, status: "resolved" }).at(-1)).toEqual({ field: "status", before: "triaged", after: "resolved" });
    expect(diffOverride({ ...current, status: "in_progress" }, { departmentId: 2 })).toHaveLength(1);
  });
});

describe("resolvedAtFor", () => {
  const now = new Date("2026-10-22T10:00:00Z");
  it("stamps on resolve, clears on reopen, otherwise leaves it", () => {
    expect(resolvedAtFor("in_progress", "resolved", now)).toBe(now);
    expect(resolvedAtFor("resolved", "assigned", now)).toBeNull();
    expect(resolvedAtFor("new", "triaged", now)).toBeUndefined();
  });
});
