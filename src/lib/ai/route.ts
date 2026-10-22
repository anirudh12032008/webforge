import { categoryLabels, departmentName } from "@/lib/i18n/messages/labels";
import type { Category, Classification, DepartmentLoad, Locale } from "@/types";

/** Safety risk at or above this marks a complaint urgent in the routing reason. */
export const URGENT_SAFETY_RISK = 4;

const categoryLabel = (c: Category) => c.replace("_", " ");

/** The reason sentence in the reader's language; English is what admins and tests see. */
const REASON = {
  en: {
    none: (cat: string) => `No department handles ${cat} yet — needs manual assignment.`,
    urgent: "Urgent safety risk. ",
    least: (n: number, cat: string) => `least loaded of ${n} teams handling ${cat}`,
    handles: (cat: string) => `handles ${cat}`,
    final: (urgent: string, name: string, choice: string, open: number, cap: number) => `${urgent}${name} ${choice} (${open}/${cap} open).`,
  },
  hi: {
    none: (cat: string) => `${cat} के लिए अभी कोई विभाग तय नहीं है — हाथ से सौंपना होगा।`,
    urgent: "सुरक्षा का गंभीर जोखिम। ",
    least: (n: number, cat: string) => `${cat} देखने वाली ${n} टीमों में सबसे कम काम वाली`,
    handles: (cat: string) => `${cat} देखती है`,
    final: (urgent: string, name: string, choice: string, open: number, cap: number) => `${urgent}${name}: ${choice} (${open}/${cap} खुली शिकायतें)।`,
  },
};

/**
 * Picks the department for a classified complaint: among departments that handle its category
 * (falling back to those handling "other"), the one with the lowest load ratio (open / capacity),
 * ties broken by id. Returns a plain-English reason so admins can see why it was routed there.
 */
export function chooseDepartment(
  classification: Pick<Classification, "category" | "safetyRisk">,
  departments: DepartmentLoad[],
  locale: Locale = "en",
): { department: DepartmentLoad | null; reason: string } {
  const t = REASON[locale];
  const cat = locale === "hi" ? categoryLabels(locale)[classification.category] : categoryLabel(classification.category);
  const handles = (c: Category) => departments.filter((d) => d.categories.includes(c));
  const candidates = handles(classification.category).length ? handles(classification.category) : handles("other");
  if (candidates.length === 0) {
    return { department: null, reason: t.none(cat) };
  }

  const load = (d: DepartmentLoad) => d.openCount / Math.max(1, d.capacity);
  const [best] = [...candidates].sort((a, b) => load(a) - load(b) || a.id - b.id);
  const urgent = classification.safetyRisk >= URGENT_SAFETY_RISK ? t.urgent : "";
  const choice = candidates.length > 1 ? t.least(candidates.length, cat) : t.handles(cat);
  return { department: best, reason: t.final(urgent, departmentName(locale, best.name), choice, best.openCount, best.capacity) };
}
