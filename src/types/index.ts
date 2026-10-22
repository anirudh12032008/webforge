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
