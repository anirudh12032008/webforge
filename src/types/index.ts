export const CATEGORIES = [
  "pothole",
  "garbage",
  "water_leak",
  "streetlight",
  "electrical",
  "sanitation",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["new", "triaged", "assigned", "in_progress", "resolved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

/** One row of the explainable priority breakdown; contributions sum to the 0–100 score. */
export type PriorityFactor = {
  factor: "safety" | "severity" | "related" | "waiting" | "community";
  weight: number;
  raw: number;
  normalized: number;
  contribution: number;
};
