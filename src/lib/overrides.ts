import type { Category, Status } from "@/types";
import type { PatchComplaintInput } from "./validation";

type Overridable = { status: Status; category: Category; departmentId: number | null };
export type FieldChange<K extends keyof Overridable = keyof Overridable> = { field: K; before: Overridable[K]; after: Overridable[K] };

/** Audit action recorded for each kind of admin override. */
export const AUDIT_ACTIONS: Record<keyof Overridable, string> = {
  status: "status_change",
  category: "category_override",
  departmentId: "assign",
};

const PRE_ASSIGNMENT: Status[] = ["new", "triaged"];

/**
 * Turns an admin PATCH into the list of fields that actually change (no-ops dropped). Assigning a
 * team to a complaint that is still new/triaged also moves it to "assigned", unless the same patch
 * sets the status explicitly, so the queue reflects who owns it.
 */
export function diffOverride(current: Overridable, patch: PatchComplaintInput): FieldChange[] {
  const changes: FieldChange[] = [];
  if (patch.category !== undefined && patch.category !== current.category) {
    changes.push({ field: "category", before: current.category, after: patch.category });
  }
  if (patch.departmentId !== undefined && patch.departmentId !== current.departmentId) {
    changes.push({ field: "departmentId", before: current.departmentId, after: patch.departmentId });
  }
  const nextStatus =
    patch.status ??
    (patch.departmentId && changes.some((c) => c.field === "departmentId") && PRE_ASSIGNMENT.includes(current.status) ? "assigned" : undefined);
  if (nextStatus !== undefined && nextStatus !== current.status) {
    changes.push({ field: "status", before: current.status, after: nextStatus });
  }
  return changes;
}

/** resolved_at follows status: stamped when a complaint becomes resolved, cleared if it's reopened. */
export function resolvedAtFor(before: Status, after: Status, now = new Date()): Date | null | undefined {
  if (after === "resolved" && before !== "resolved") return now;
  if (before === "resolved" && after !== "resolved") return null;
  return undefined;
}
