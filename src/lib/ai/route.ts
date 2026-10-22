import type { Category, Classification, DepartmentLoad } from "@/types";

/** Safety risk at or above this marks a complaint urgent in the routing reason. */
export const URGENT_SAFETY_RISK = 4;

const categoryLabel = (c: Category) => c.replace("_", " ");

/**
 * Picks the department for a classified complaint: among departments that handle its category
 * (falling back to those handling "other"), the one with the lowest load ratio (open / capacity),
 * ties broken by id. Returns a plain-English reason so admins can see why it was routed there.
 */
export function chooseDepartment(
  classification: Pick<Classification, "category" | "safetyRisk">,
  departments: DepartmentLoad[],
): { department: DepartmentLoad | null; reason: string } {
  const handles = (c: Category) => departments.filter((d) => d.categories.includes(c));
  const candidates = handles(classification.category).length ? handles(classification.category) : handles("other");
  if (candidates.length === 0) {
    return { department: null, reason: `No department handles ${categoryLabel(classification.category)} yet — needs manual assignment.` };
  }

  const load = (d: DepartmentLoad) => d.openCount / Math.max(1, d.capacity);
  const [best] = [...candidates].sort((a, b) => load(a) - load(b) || a.id - b.id);
  const urgent = classification.safetyRisk >= URGENT_SAFETY_RISK ? "Urgent safety risk. " : "";
  const choice =
    candidates.length > 1 ? `least loaded of ${candidates.length} teams handling ${categoryLabel(classification.category)}` : `handles ${categoryLabel(classification.category)}`;
  return { department: best, reason: `${urgent}${best.name} ${choice} (${best.openCount}/${best.capacity} open).` };
}
