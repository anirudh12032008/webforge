import { describe, expect, it } from "vitest";
import type { Category, DepartmentLoad } from "@/types";
import { chooseDepartment } from "./route";

const dept = (id: number, categories: Category[], openCount: number, capacity = 10): DepartmentLoad => ({
  id,
  orgId: 1,
  name: `Dept ${id}`,
  slug: `dept-${id}`,
  categories,
  capacity,
  openCount,
});

describe("chooseDepartment", () => {
  it("picks the least loaded department that handles the category", () => {
    const { department, reason } = chooseDepartment({ category: "pothole", safetyRisk: 2 }, [
      dept(1, ["pothole"], 8),
      dept(2, ["pothole", "garbage"], 3),
      dept(3, ["garbage"], 0),
    ]);
    expect(department?.id).toBe(2);
    expect(reason).toContain("least loaded of 2");
  });

  it("compares load relative to capacity, not raw counts", () => {
    const { department } = chooseDepartment({ category: "garbage", safetyRisk: 1 }, [
      dept(1, ["garbage"], 4, 5),
      dept(2, ["garbage"], 6, 20),
    ]);
    expect(department?.id).toBe(2);
  });

  it("falls back to the catch-all department, then to manual assignment", () => {
    expect(chooseDepartment({ category: "streetlight", safetyRisk: 1 }, [dept(9, ["other"], 0)]).department?.id).toBe(9);
    expect(chooseDepartment({ category: "streetlight", safetyRisk: 1 }, []).department).toBeNull();
  });

  it("flags urgent safety risks in the reason", () => {
    expect(chooseDepartment({ category: "electrical", safetyRisk: 5 }, [dept(1, ["electrical"], 0)]).reason).toMatch(/^Urgent/);
  });
});
