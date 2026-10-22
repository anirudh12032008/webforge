import type { Category, PriorityFactor } from "@/types";

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
