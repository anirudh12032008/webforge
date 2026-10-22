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

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const ORG_KINDS = ["city", "campus"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

/** A body that handles complaints (e.g. Bhopal Municipal Corporation, MANIT campus). */
export type Org = { id: number; slug: string; name: string; kind: OrgKind };

export type Department = {
  id: number;
  orgId: number;
  name: string;
  slug: string;
  categories: Category[];
  capacity: number;
};

/** A department plus how many unresolved complaints it currently holds. */
export type DepartmentLoad = Department & { openCount: number };

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
  orgId: number;
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
  /** AI-written title and description, used when the reporter sent only a photo. */
  suggestedTitle: string;
  summary: string;
  usedFallback: boolean;
};

/** Everything the AI pipeline decided for a new complaint, returned to the reporter. */
export type Analysis = {
  classification: Classification;
  duplicateOf: string | null;
  relatedIds: string[];
  priority: { score: number; rank: number; breakdown: PriorityFactor[] };
  department: Department | null;
  routingReason: string;
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

/** One row of the admin triage table. */
export type ComplaintListItem = Pick<
  Complaint,
  "id" | "title" | "locationLabel" | "location" | "category" | "categoryConfidence" | "safetyRisk" | "priorityScore" | "status" | "relatedCount" | "createdAt"
> & { departmentName: string | null; orgSlug: string; orgName: string };

/** Headline numbers for the dashboard, scoped to the selected org. */
export type DashboardStats = { open: number; urgent: number; overdue: number; linkedDuplicates: number };

/** A complaint as a map marker. */
export type MapPoint = Pick<Complaint, "id" | "title" | "location" | "category" | "priorityScore" | "status">;

/** What a reporter may see about their own complaint: no contact details, no embedding. */
export type ReporterView = Pick<Complaint, "id" | "title" | "category" | "status" | "priorityScore" | "locationLabel" | "duplicateOf" | "createdAt" | "resolvedAt"> & {
  departmentName: string | null;
  history: { status: Status; at: string }[];
};
