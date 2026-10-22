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

export type LngLat = { lng: number; lat: number };

export type Department = {
  id: number;
  name: string;
  slug: string;
  categories: Category[];
  capacity: number;
};

/** A complaint as sent over the API: no embedding, ISO date strings. */
export type Complaint = {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  location: LngLat;
  locationLabel: string | null;
  category: Category;
  categoryConfidence: number | null;
  severity: number | null;
  safetyRisk: number | null;
  communityImpact: number | null;
  aiReasoning: string | null;
  priorityScore: number;
  priorityBreakdown: PriorityFactor[] | null;
  status: Status;
  departmentId: number | null;
  clusterId: number | null;
  duplicateOf: string | null;
  relatedCount: number;
  reporterName: string | null;
  reporterContact: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

/** What Claude returns for one complaint (or the fallback when it can't). */
export type Classification = {
  category: Category;
  confidence: number;
  severity: number;
  safetyRisk: number;
  communityImpact: number;
  reasoning: string;
  usedFallback: boolean;
};

/** Everything the AI pipeline decided for a new complaint, returned to the reporter. */
export type Analysis = {
  classification: Classification;
  duplicateOf: string | null;
  relatedIds: string[];
  priority: { score: number; rank: number; breakdown: PriorityFactor[] };
  department: Department | null;
};

export type AuditEntry = {
  id: number;
  complaintId: string;
  actor: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};
