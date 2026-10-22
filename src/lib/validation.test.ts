import { describe, expect, it } from "vitest";
import { listComplaintsQuerySchema, patchComplaintSchema } from "./validation";

describe("listComplaintsQuerySchema", () => {
  it("applies defaults and coerces numbers", () => {
    expect(listComplaintsQuerySchema.parse({ page: "2" })).toEqual({ sort: "priority", page: 2, pageSize: 25 });
  });

  it("parses a valid bbox", () => {
    const q = listComplaintsQuerySchema.parse({ bbox: "77.39,23.20,77.42,23.23" });
    expect(q.bbox).toEqual({ minLng: 77.39, minLat: 23.2, maxLng: 77.42, maxLat: 23.23 });
  });

  it.each(["1,2,3", "a,b,c,d", "77.42,23.20,77.39,23.23"])("rejects bad bbox %s", (bbox) => {
    expect(listComplaintsQuerySchema.safeParse({ bbox }).success).toBe(false);
  });
});

describe("patchComplaintSchema", () => {
  it("rejects an empty patch", () => {
    expect(patchComplaintSchema.safeParse({}).success).toBe(false);
  });

  it("allows clearing the department", () => {
    expect(patchComplaintSchema.parse({ departmentId: null })).toEqual({ departmentId: null });
  });
});
