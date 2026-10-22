import { Download, Repeat } from "lucide-react";
import type { Metadata } from "next";
import { OrgTabs } from "@/components/admin/org-tabs";
import { BarChart } from "@/components/analytics/bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { buttonVariants } from "@/components/ui/button";
import { getAnalytics } from "@/db/analytics";
import { SLA_HOURS } from "@/db/dashboard";
import { getHotspots } from "@/lib/geo/clusters";
import { CATEGORY_LABELS, waitingFor } from "@/lib/labels";
import { orgQuerySchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Analytics — CampusSense" };
export const dynamic = "force-dynamic";

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 rounded-xl border bg-card p-5 ${className}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = orgQuerySchema.safeParse({ org: (await searchParams).org });
  const org = parsed.success ? parsed.data.org : undefined;
  const [{ summary, daily, byCategory, byDepartment, resolutionByCategory }, hotspots] = await Promise.all([getAnalytics(org), getHotspots(org)]);

  const tiles = [
    { label: "Open", value: summary.open },
    { label: "Resolved", value: summary.resolved },
    { label: "Average time to resolve", value: summary.avgResolutionHours === null ? "–" : `${summary.avgResolutionHours} h` },
    { label: `Open past ${SLA_HOURS} h`, value: summary.slaBreaches, alert: summary.slaBreaches > 0 },
    { label: "Duplicate reports merged", value: summary.duplicatesMerged },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-5">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Analytics</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">How fast problems are reported and fixed, which teams are stretched, and where issues keep coming back.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OrgTabs basePath="/analytics" current={org} />
          <a href={`/api/export${org ? `?org=${org}` : ""}`} className={buttonVariants({ variant: "outline" })} download>
            <Download aria-hidden /> Export CSV
          </a>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="bg-card p-4">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className={`mt-1 text-3xl font-semibold tabular-nums ${t.alert ? "text-safety" : ""}`}>{t.value}</dd>
          </div>
        ))}
      </dl>

      <Panel title="Reported vs resolved, last 30 days">
        <TrendChart data={daily} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Open complaints by category">
          <BarChart data={byCategory.filter((c) => c.open > 0).map((c) => ({ label: CATEGORY_LABELS[c.category], value: c.open }))} valueLabel="Open" />
        </Panel>
        <Panel title="Open complaints by team">
          <BarChart data={byDepartment.map((d) => ({ label: d.name, value: d.open }))} valueLabel="Open" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title="Average time to resolve, by category">
          <BarChart data={resolutionByCategory.map((r) => ({ label: CATEGORY_LABELS[r.category], value: r.hours }))} valueLabel="Average" unit=" h" />
        </Panel>

        <Panel title="Hotspots">
          {hotspots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clusters yet. Hotspots appear when 2 or more reports land within 60 m.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1.5 font-medium">Location</th>
                  <th className="py-1.5 font-medium">Last 30 days</th>
                  <th className="py-1.5 font-medium">Problems</th>
                  <th className="py-1.5 font-medium">Last report</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((h) => (
                  <tr key={h.clusterId} className="border-t">
                    <td className="py-2">
                      {h.label ?? `${h.center.lat.toFixed(4)}, ${h.center.lng.toFixed(4)}`}
                      {h.recurring && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-safety/10 px-2 py-0.5 text-xs font-medium text-safety">
                          <Repeat className="size-3" aria-hidden /> Recurring
                        </span>
                      )}
                    </td>
                    <td className="py-2 tabular-nums">{h.recentReports} reports</td>
                    <td className="py-2">{h.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}</td>
                    <td className="py-2 text-muted-foreground" suppressHydrationWarning>{waitingFor(h.lastReportedAt)} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
