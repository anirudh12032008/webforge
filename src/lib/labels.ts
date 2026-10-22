import type { Category, PriorityFactor, Status } from "@/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  pothole: "Pothole or road damage",
  garbage: "Garbage",
  water_leak: "Water leak",
  streetlight: "Streetlight",
  electrical: "Electrical hazard",
  sanitation: "Sanitation or drainage",
  other: "Other",
};

export const FACTOR_LABELS: Record<PriorityFactor["factor"], string> = {
  safety: "Safety risk",
  severity: "Severity",
  related: "Similar reports",
  waiting: "Time waiting",
  community: "People affected",
};

export const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

/** Priority bands used for marker and pill colours: ≥70 urgent, ≥40 elevated, else routine. */
export function priorityBand(score: number): { label: string; hex: string; className: string } {
  if (score >= 70) return { label: "Urgent", hex: "#c8372d", className: "bg-safety text-white" };
  if (score >= 40) return { label: "Elevated", hex: "#f2c230", className: "bg-signal text-foreground" };
  return { label: "Routine", hex: "#1c5d8c", className: "bg-primary text-primary-foreground" };
}

/** "5 h" / "3 d" since an ISO timestamp, for waiting-time columns. */
export function waitingFor(iso: string, now = Date.now()): string {
  const hours = Math.max(0, (now - new Date(iso).getTime()) / 3_600_000);
  return hours < 48 ? `${Math.floor(hours)} h` : `${Math.floor(hours / 24)} d`;
}
