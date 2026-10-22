import { ArrowLeft, CircleCheck, Clock, Copy, FileText, History, ImageOff, Link2, MapPin, Radar, SlidersHorizontal, Sparkles, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ago, EmptyState, Panel, StatusChip } from "@/components/admin/console";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { ExplainPriority } from "@/components/admin/explain-priority";
import { MergeControls } from "@/components/admin/merge-controls";
import { OverrideControls } from "@/components/admin/override-controls";
import { StreetView } from "@/components/admin/street-view";
import { PriorityBar } from "@/components/shared/priority-bar";
import { getComplaintDetail, type LinkedReport } from "@/db/complaint-detail";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { categoryLabels, factorLabels, orgName } from "@/lib/i18n/messages/labels";
import { getLocale } from "@/lib/i18n/server";
import { priorityBand } from "@/lib/labels";
import type { Locale } from "@/types";

export const metadata: Metadata = { title: "Complaint | CivicLens" };
export const dynamic = "force-dynamic";

function LinkedList({ items, empty, locale }: { items: LinkedReport[]; empty: string; locale: Locale }) {
  if (items.length === 0) return <EmptyState icon={CircleCheck}>{empty}</EmptyState>;
  return (
    <ul className="divide-y text-sm">
      {items.map((r) => (
        <li key={r.id}>
          <Link href={`/complaints/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
            <span className="min-w-0 truncate font-medium">{r.title}</span>
            {r.similarity !== undefined ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{pick(ADMIN, locale).similar(Math.round(r.similarity * 100))}</span>
            ) : (
              <StatusChip status={r.status} locale={locale} />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Score({ label, value, alert }: { label: string; value: number | null; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${alert ? "border-safety/40 bg-safety/5" : "bg-background"}`}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={`mt-1 font-heading text-2xl font-semibold tabular-nums ${alert ? "text-safety" : ""}`}>
        {value ?? "–"}
        <span className="text-sm font-normal text-muted-foreground">/5</span>
      </dd>
    </div>
  );
}

export default async function ComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  const [detail, locale] = await Promise.all([id.success ? getComplaintDetail(id.data) : null, getLocale()]);
  if (!detail) notFound();
  const t = pick(ADMIN, locale);
  const { complaint: c, org, orgDepartments, duplicates, related, audit } = detail;
  const band = priorityBand(c.priorityScore);
  const usedFallback = audit.some((a) => a.action === "ai_analysis" && a.after?.usedFallback === true);

  const coords = `${c.location.lat.toFixed(5)}, ${c.location.lng.toFixed(5)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> {t.backToTriage}
        </Link>
        <a href="#actions" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary lg:hidden">
          <SlidersHorizontal className="size-4" aria-hidden /> {t.jumpToActions}
        </a>
      </div>

      <header className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="hazard-band h-2" aria-hidden />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-medium">#{c.id.slice(0, 8)}</span>
              <StatusChip status={c.status} locale={locale} />
              <span>{orgName(locale, org)}</span>
            </div>
            <h1 className="mt-2 text-2xl leading-tight font-semibold text-balance sm:text-3xl">{c.title}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
              {c.locationLabel ?? coords}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" aria-hidden />
              <span>
                {t.reportedLabel} <span suppressHydrationWarning>{ago(c.createdAt, locale)}</span>{c.reporterName ? t.by(c.reporterName) : ""}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 border-t pt-4 sm:block sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-right">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.priority}</p>
            <p className={`inline-block rounded-lg px-3 py-1.5 font-heading text-4xl font-semibold tabular-nums sm:mt-1 ${band.className}`}>{Math.round(c.priorityScore)}</p>
            <p className="text-sm font-medium sm:mt-1">{t.band[band.label]}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-6">
          <Panel title={t.report} icon={FileText}>
            <div className="space-y-4">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded Blob URL, arbitrary size
                <img src={c.photoUrl} alt={t.photoAlt(c.title)} className="max-h-96 w-full rounded-lg border bg-muted object-cover" />
              ) : (
                <EmptyState icon={ImageOff}>{t.noPhoto}</EmptyState>
              )}
              <p className="leading-relaxed whitespace-pre-line">{c.description}</p>
            </div>
          </Panel>

          <Panel title={t.location} icon={MapPin} action={<span className="font-mono text-xs text-muted-foreground">{coords}</span>}>
            <StreetView location={c.location} />
          </Panel>

          <Panel title={t.aiAssessment} icon={Sparkles}>
            <div className="space-y-5">
              {usedFallback && (
                <p className="flex gap-2 rounded-lg border border-signal bg-signal/15 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t.aiFallback}
                </p>
              )}
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-semibold">{categoryLabels(locale)[c.category]}</p>
                  {c.categoryConfidence !== null && <p className="text-sm text-muted-foreground tabular-nums">{t.confident(Math.round(c.categoryConfidence * 100))}</p>}
                </div>
                {c.categoryConfidence !== null && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(c.categoryConfidence * 100)}%` }} />
                  </div>
                )}
              </div>
              {c.aiReasoning && (
                <p className="flex gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {c.aiReasoning}
                </p>
              )}
              <dl className="grid grid-cols-3 gap-2 sm:gap-3">
                <Score label={t.severity} value={c.severity} />
                <Score label={t.safety} value={c.safetyRisk} alert={(c.safetyRisk ?? 0) >= 4} />
                <Score label={t.impact} value={c.communityImpact} />
              </dl>
              {c.priorityBreakdown && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">{t.whyScores(Math.round(c.priorityScore))}</h3>
                  <PriorityBar breakdown={c.priorityBreakdown} labels={factorLabels(locale)} />
                </div>
              )}
              <div className="border-t pt-4">
                <ExplainPriority complaintId={c.id} />
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <Panel title={<>{t.duplicates} <Count n={duplicates.length} /></>} icon={Copy} bodyClassName="px-4 py-2 sm:px-5">
              <LinkedList items={duplicates} empty={t.duplicatesEmpty} locale={locale} />
            </Panel>
            <Panel title={<>{t.related} <Count n={related.length} /></>} icon={Radar} bodyClassName="px-4 py-2 sm:px-5">
              <LinkedList items={related} empty={t.relatedEmpty} locale={locale} />
            </Panel>
          </div>
        </div>

        <aside id="actions" className="min-w-0 scroll-mt-4 space-y-6">
          <Panel title={t.override} icon={SlidersHorizontal} description={t.overrideDesc}>
            <OverrideControls complaintId={c.id} status={c.status} category={c.category} departmentId={c.departmentId} departments={orgDepartments} />
          </Panel>
          <Panel title={t.merge} icon={Link2} description={c.duplicateOf ? t.mergedDesc : t.mergeDesc}>
            <MergeControls complaintId={c.id} duplicateOf={c.duplicateOf} related={related} />
          </Panel>
          <Panel title={<>{t.activity} <Count n={audit.length} /></>} icon={History}>
            <AuditTimeline entries={audit} departments={orgDepartments} locale={locale} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{n}</span>;
}
