import type { Metadata } from "next";
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
  const kpis = [
    { label: "Open", value: stats.open },
    { label: "Safety risk 4–5", value: stats.urgent, alert: stats.urgent > 0 },
    { label: `Waiting over ${SLA_HOURS} h`, value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Duplicate reports merged", value: stats.linkedDuplicates },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-5">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Triage</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">Open complaints across campus and city, ranked by AI priority. Open any row to review, assign or override.</p>
        </div>
        <OrgTabs basePath="/dashboard" current={query.org} />
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card p-4">
            <dt className="text-sm text-muted-foreground">{k.label}</dt>
            <dd className={`mt-1 text-3xl font-semibold tabular-nums ${k.alert ? "text-safety" : ""}`}>{k.value}</dd>
          </div>
        ))}
      </dl>

      <PriorityMap points={points} />
      <TriageTable items={list.items} total={list.total} query={query} />
    </div>
  );
}
