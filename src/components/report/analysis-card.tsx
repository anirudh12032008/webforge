"use client";

import { Building2, Link2, ShieldAlert, Sparkles } from "lucide-react";
import { useLocale } from "@/components/shared/locale-provider";
import { PriorityBar } from "@/components/shared/priority-bar";
import { pick } from "@/lib/i18n";
import { categoryLabels, factorLabels } from "@/lib/i18n/messages/labels";
import { REPORT } from "@/lib/i18n/messages/report";
import type { Analysis, Complaint } from "@/types";

type Copy = (typeof REPORT)["en"];

const shortId = (id: string) => `#${id.slice(0, 8)}`;

function Rating({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${alert ? "text-safety" : ""}`}>{value}/5</dd>
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
  return (
    <article className="space-y-6 rounded-xl border bg-card p-5 sm:p-6" aria-live="polite">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
        <h2 className="text-xl font-semibold">{t.received(shortId(complaint.id))}</h2>
        <p className="text-sm text-muted-foreground">
          {t.queue(priority.rank, priority.score)}
        </p>
      </header>

      {c.usedFallback && (
        <p className="rounded-md bg-muted p-3 text-sm">{t.fallback}</p>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium">{categoryLabels(locale)[c.category]}</p>
          <p className="text-sm text-muted-foreground tabular-nums">{t.sure(Math.round(c.confidence * 100))}</p>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${c.confidence * 100}%` }} />
        </div>
        <p className="flex gap-2 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          {c.reasoning}
        </p>
      </section>

      <dl className="grid grid-cols-3 gap-4">
        <Rating label={t.severity} value={c.severity} />
        <Rating label={t.safety} value={c.safetyRisk} alert={c.safetyRisk >= 4} />
        <Rating label={t.people} value={c.communityImpact} />
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t.whyRanks}</h3>
        <PriorityBar breakdown={priority.breakdown} labels={factorLabels(locale)} />
      </section>

      <ul className="space-y-3 text-sm">
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
    </article>
  );
}
