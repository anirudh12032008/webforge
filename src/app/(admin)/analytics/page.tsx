import { Download, Flame, Repeat, Tags, Timer, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import { ago, ConsoleHeader, EmptyState, KpiStrip, Panel, type Kpi } from "@/components/admin/console";
import { OrgTabs } from "@/components/admin/org-tabs";
import { BarChart } from "@/components/analytics/bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { buttonVariants } from "@/components/ui/button";
import { getAnalytics } from "@/db/analytics";
import { SLA_HOURS } from "@/db/dashboard";
import { getHotspots } from "@/lib/geo/clusters";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { categoryLabels, departmentName } from "@/lib/i18n/messages/labels";
import { getLocale } from "@/lib/i18n/server";
import { orgQuerySchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Analytics | CivicLens" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = orgQuerySchema.safeParse({ org: (await searchParams).org });
  const org = parsed.success ? parsed.data.org : undefined;
  const [{ summary, daily, byCategory, byDepartment, resolutionByCategory }, hotspots, locale] = await Promise.all([getAnalytics(org), getHotspots(org), getLocale()]);
  const t = pick(ADMIN, locale);
  const CATEGORY_LABELS = categoryLabels(locale);

  const tiles: Kpi[] = [
    { label: t.open, value: summary.open },
    { label: t.resolved, value: summary.resolved },
    { label: t.avgResolve, value: summary.avgResolutionHours === null ? "–" : `${summary.avgResolutionHours} ${t.hours}` },
    { label: t.openPast(SLA_HOURS), value: summary.slaBreaches, alert: summary.slaBreaches > 0, hint: summary.slaBreaches > 0 ? t.targetMissed : t.withinTarget },
    { label: t.dupesMerged, value: summary.duplicatesMerged },
  ];
  const maxRecent = Math.max(1, ...hotspots.map((h) => h.recentReports));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <ConsoleHeader eyebrow={t.anEyebrow} title={t.anTitle} description={t.anIntro}>
        <OrgTabs basePath="/analytics" current={org} />
        <a href={`/api/export${org ? `?org=${org}` : ""}`} className={buttonVariants({ size: "lg", className: "px-3" })} download>
          <Download aria-hidden /> {t.exportCsv}
        </a>
      </ConsoleHeader>

      <KpiStrip items={tiles} locale={locale} />

      <Panel title={t.trendTitle} icon={TrendingUp} description={t.trendDesc}>
        <TrendChart data={daily} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t.byCatTitle} icon={Tags} description={t.byCatDesc}>
          <BarChart data={byCategory.filter((c) => c.open > 0).map((c) => ({ label: CATEGORY_LABELS[c.category], value: c.open }))} valueLabel={t.open} />
        </Panel>
        <Panel title={t.byTeamTitle} icon={Users} description={t.byTeamDesc}>
          <BarChart data={byDepartment.map((d) => ({ label: departmentName(locale, d.name), value: d.open }))} valueLabel={t.open} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title={t.resolveTitle} icon={Timer} description={t.resolveDesc}>
          <BarChart data={resolutionByCategory.map((r) => ({ label: CATEGORY_LABELS[r.category], value: r.hours }))} valueLabel={t.average} unit={` ${t.hours}`} color="#c27400" />
        </Panel>

        <Panel
          title={
            <>
              {t.hotspots} <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{hotspots.length}</span>
            </>
          }
          icon={Flame}
          description={t.hotspotsDesc}
          bodyClassName="px-4 py-2 sm:px-5"
        >
          {hotspots.length === 0 ? (
            <div className="py-3">
              <EmptyState icon={Flame}>{t.hotspotsEmpty}</EmptyState>
            </div>
          ) : (
            <ol className="divide-y">
              {hotspots.map((h, i) => (
                <li key={h.clusterId} className="flex gap-3 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground font-heading text-sm font-semibold text-signal tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium">{h.label ?? `${h.center.lat.toFixed(4)}, ${h.center.lng.toFixed(4)}`}</p>
                      {h.recurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-safety/10 px-2 py-0.5 text-xs font-medium text-safety">
                          <Repeat className="size-3" aria-hidden /> {t.recurring}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{h.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span className="block h-full rounded-full bg-[#1f6fb8]" style={{ width: `${(h.recentReports / maxRecent) * 100}%` }} />
                      </span>
                      <span className="font-medium text-foreground tabular-nums">{t.reportsN(h.recentReports)}</span>
                      <span suppressHydrationWarning>{t.last(ago(h.lastReportedAt, locale))}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
