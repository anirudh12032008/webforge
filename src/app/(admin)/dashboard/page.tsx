import type { Metadata } from "next";
import { ConsoleHeader, KpiStrip, type Kpi } from "@/components/admin/console";
import { OrgTabs } from "@/components/admin/org-tabs";
import { PriorityMap } from "@/components/admin/priority-map";
import { TriageTable } from "@/components/admin/triage-table";
import { getDashboardStats, listComplaints, listMapPoints, SLA_HOURS } from "@/db/dashboard";
import { listComplaintsQuerySchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Triage dashboard — CampusSense" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = Object.fromEntries(Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string"));
  const parsed = listComplaintsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listComplaintsQuerySchema.parse({});

  const [stats, list, points] = await Promise.all([getDashboardStats(query.org), listComplaints(query), listMapPoints(query.org)]);
  const kpis: Kpi[] = [
    { label: "Open", value: stats.open, hint: "In the queue now" },
    { label: "Safety risk 4–5", value: stats.urgent, hint: stats.urgent > 0 ? "Check these first" : "None flagged", alert: stats.urgent > 0 },
    { label: `Waiting over ${SLA_HOURS} h`, value: stats.overdue, hint: stats.overdue > 0 ? "Past the response target" : "All within target", alert: stats.overdue > 0 },
    { label: "Duplicates merged", value: stats.linkedDuplicates, hint: "Reports folded into one" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <ConsoleHeader eyebrow="Ops console · live queue" title="Triage" description="Open complaints across campus and city, ranked by AI priority. Open any row to review, assign or override.">
        <OrgTabs basePath="/dashboard" current={query.org} />
      </ConsoleHeader>

      <KpiStrip items={kpis} />

      <PriorityMap points={points} />
      <TriageTable items={list.items} total={list.total} query={query} slaHours={SLA_HOURS} />
    </div>
  );
}
