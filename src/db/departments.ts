import { and, eq, notInArray, sql } from "drizzle-orm";
import type { DepartmentLoad } from "@/types";
import { db } from "./client";
import { complaints, departments } from "./schema";

/**
 * Every department of an org with its current open-complaint count, via a LEFT JOIN so
 * departments with nothing assigned still appear with openCount 0.
 */
export async function getDepartmentsWithLoad(orgId: number): Promise<DepartmentLoad[]> {
  return db
    .select({
      id: departments.id,
      orgId: departments.orgId,
      name: departments.name,
      slug: departments.slug,
      categories: departments.categories,
      capacity: departments.capacity,
      openCount: sql<number>`count(${complaints.id})`.mapWith(Number),
    })
    .from(departments)
    .leftJoin(
      complaints,
      and(eq(complaints.departmentId, departments.id), notInArray(complaints.status, ["resolved", "rejected"])),
    )
    .where(eq(departments.orgId, orgId))
    .groupBy(departments.id);
}
