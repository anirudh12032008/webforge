import { listComplaints } from "@/db/dashboard";
import { toCsv } from "@/lib/csv";
import { validationError } from "@/lib/http";
import { listComplaintsQuerySchema } from "@/lib/validation";

const EXPORT_LIMIT = 5000;

/** CSV download of the triage queue, honouring the same filters as GET /api/complaints. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = listComplaintsQuerySchema.omit({ page: true, pageSize: true }).safeParse(params);
  if (!parsed.success) return validationError(parsed.error, "Invalid filters");

  const { items } = await listComplaints({ ...parsed.data, page: 1, pageSize: EXPORT_LIMIT });
  const rows = items.map((c) => ({
    id: c.id,
    title: c.title,
    org: c.orgName,
    category: c.category,
    status: c.status,
    priority: c.priorityScore,
    safety_risk: c.safetyRisk,
    team: c.departmentName,
    linked_reports: c.relatedCount,
    location: c.locationLabel,
    lat: c.location.lat,
    lng: c.location.lng,
    reported_at: c.createdAt,
  }));
  const csv = toCsv(rows, ["id", "title", "org", "category", "status", "priority", "safety_risk", "team", "linked_reports", "location", "lat", "lng", "reported_at"]);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="campussense-complaints-${date}.csv"`,
    },
  });
}
