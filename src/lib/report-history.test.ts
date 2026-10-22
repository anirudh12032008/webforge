import { describe, expect, it } from "vitest";
import { buildStatusHistory } from "./report-history";

const t = (h: number) => new Date(Date.UTC(2026, 9, 22, h)).toISOString();

describe("buildStatusHistory", () => {
  it("starts at new and follows AI analysis then admin status changes in time order", () => {
    const history = buildStatusHistory(t(1), [
      { action: "status_change", after: { status: "resolved" }, createdAt: t(9) },
      { action: "ai_analysis", after: { status: "triaged", category: "pothole" }, createdAt: t(1) },
      { action: "assign", after: { departmentId: 3 }, createdAt: t(4) },
      { action: "status_change", after: { status: "in_progress" }, createdAt: t(5) },
    ]);
    expect(history.map((h) => h.status)).toEqual(["new", "triaged", "in_progress", "resolved"]);
    expect(history.at(-1)?.at).toBe(t(9));
  });

  it("collapses repeats and ignores unknown statuses", () => {
    const history = buildStatusHistory(t(1), [
      { action: "status_change", after: { status: "new" }, createdAt: t(2) },
      { action: "status_change", after: { status: "bogus" }, createdAt: t(3) },
    ]);
    expect(history).toEqual([{ status: "new", at: t(1) }]);
  });
});
