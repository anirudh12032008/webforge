"use client";

import { Building2, Link2, ShieldAlert, Sparkles } from "lucide-react";
import { useLocale } from "@/components/shared/locale-provider";
import { PriorityBar } from "@/components/shared/priority-bar";
import { priorityBand } from "@/lib/labels";
import { pick } from "@/lib/i18n";
import { categoryLabels, factorLabels } from "@/lib/i18n/messages/labels";
import { REPORT } from "@/lib/i18n/messages/report";
import type { Analysis, Complaint } from "@/types";

type Copy = (typeof REPORT)["en"];

const shortId = (id: string) => `#${id.slice(0, 8)}`;

function Rating({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="flex flex-col justify-between rounded-lg bg-muted/60 p-3">
      <dt className="text-xs leading-tight text-muted-foreground sm:text-sm">{label}</dt>
      <dd className={`mt-1 font-heading text-xl font-semibold tabular-nums ${alert ? "text-safety" : ""}`}>
        {value}
        <span className="text-sm font-normal text-muted-foreground">/5</span>
      </dd>
    </div>
  );
}

function duplicateNote(analysis: Analysis, t: Copy): string {
  if (analysis.duplicateOf) return t.duplicateOf(shortId(analysis.duplicateOf));
  if (analysis.relatedIds.length) return t.similar(analysis.relatedIds.length);
  return t.firstReport;
}

/** What the AI decided about a just-submitted complaint, with the reasons behind each decision. */
export function AnalysisCard({ complaint, analysis }: { complaint: Complaint; analysis: Analysis }) {
  const locale = useLocale();
  const t = pick(REPORT, locale);
  const { classification: c, priority } = analysis;
  const band = priorityBand(priority.score);
  // Sections fade up one after another so the AI's decisions read as a sequence, not a wall.
  const reveal = "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none";
  return (
    <article className={`overflow-hidden rounded-xl border bg-card shadow-[0_24px_48px_-24px_rgb(31_35_40/0.35)] ${reveal}`} aria-live="polite">
      <div className="hazard-band h-2" aria-hidden />
      <div className="space-y-6 p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-dashed pb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-balance">{t.received(shortId(complaint.id))}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.queue(priority.rank, priority.score)}</p>
          </div>
          <p className={`shrink-0 rounded-md px-2.5 py-1 font-heading text-3xl font-semibold tabular-nums ${band.className}`}>
            {Math.round(priority.score)}
          </p>
        </header>

        {c.usedFallback && (
          <p className="rounded-md bg-muted p-3 text-sm">{t.fallback}</p>
        )}

        <section className={`space-y-2 delay-150 ${reveal}`}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">{categoryLabels(locale)[c.category]}</p>
            <p className="text-sm text-muted-foreground tabular-nums">{t.sure(Math.round(c.confidence * 100))}</p>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${c.confidence * 100}%` }} />
          </div>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
            {c.reasoning}
          </p>
        </section>

        <dl className={`grid grid-cols-3 gap-2 delay-300 sm:gap-4 ${reveal}`}>
          <Rating label={t.severity} value={c.severity} />
          <Rating label={t.safety} value={c.safetyRisk} alert={c.safetyRisk >= 4} />
          <Rating label={t.people} value={c.communityImpact} />
        </dl>

        <section className={`space-y-2 delay-500 ${reveal}`}>
          <h3 className="text-sm font-medium">{t.whyRanks}</h3>
          <PriorityBar breakdown={priority.breakdown} labels={factorLabels(locale)} />
        </section>

        <ul className={`space-y-3 border-t pt-4 text-sm delay-700 ${reveal}`}>
          <li className="flex gap-2">
            <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>{duplicateNote(analysis, t)}</span>
          </li>
          <li className="flex gap-2">
            {c.safetyRisk >= 4 ? (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-safety" aria-hidden />
            ) : (
              <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span>{analysis.routingReason}</span>
          </li>
        </ul>
      </div>
    </article>
  );
}
