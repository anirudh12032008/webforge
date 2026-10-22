import type { Metadata } from "next";
import { ConsoleHeader, KpiStrip, type Kpi } from "@/components/admin/console";
import { OrgTabs } from "@/components/admin/org-tabs";
import { PriorityMap } from "@/components/admin/priority-map";
import { TriageTable } from "@/components/admin/triage-table";
import { getDashboardStats, listComplaints, listMapPoints, SLA_HOURS } from "@/db/dashboard";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { getLocale } from "@/lib/i18n/server";
import { listComplaintsQuerySchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Triage dashboard | CivicLens" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = Object.fromEntries(Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string"));
  const parsed = listComplaintsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listComplaintsQuerySchema.parse({});

  const [stats, list, points, locale] = await Promise.all([getDashboardStats(query.org), listComplaints(query), listMapPoints(query.org), getLocale()]);
  const t = pick(ADMIN, locale);
  const kpis: Kpi[] = [
    { label: t.open, value: stats.open, hint: t.openHint },
    { label: t.urgent, value: stats.urgent, hint: stats.urgent > 0 ? t.urgentHint : t.noneFlagged, alert: stats.urgent > 0 },
    { label: t.overdue(SLA_HOURS), value: stats.overdue, hint: stats.overdue > 0 ? t.overdueHint : t.withinTarget, alert: stats.overdue > 0 },
    { label: t.dupesMerged, value: stats.linkedDuplicates, hint: t.dupesHint },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <ConsoleHeader eyebrow={t.dashEyebrow} title={t.dashTitle} description={t.dashIntro}>
        <OrgTabs basePath="/dashboard" current={query.org} />
      </ConsoleHeader>

      <KpiStrip items={kpis} locale={locale} />

      <PriorityMap points={points} />
      <TriageTable items={list.items} total={list.total} query={query} slaHours={SLA_HOURS} />
    </div>
  );
}
