import { Building2, Link2, ShieldAlert, Sparkles } from "lucide-react";
import { PriorityBar } from "@/components/shared/priority-bar";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { Analysis, Complaint } from "@/types";

const shortId = (id: string) => `#${id.slice(0, 8)}`;

function Rating({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${alert ? "text-safety" : ""}`}>{value}/5</dd>
    </div>
  );
}

function DuplicateNote({ analysis }: { analysis: Analysis }) {
  if (analysis.duplicateOf) {
    return <>Already reported as {shortId(analysis.duplicateOf)}. Your report was added to it, which raises its priority.</>;
  }
  if (analysis.relatedIds.length) {
    return <>{analysis.relatedIds.length} similar report{analysis.relatedIds.length > 1 ? "s" : ""} within 75 m. They&apos;re linked so the team sees them together.</>;
  }
  return <>First report of this issue nearby.</>;
}

/** What the AI decided about a just-submitted complaint, with the reasons behind each decision. */
export function AnalysisCard({ complaint, analysis }: { complaint: Complaint; analysis: Analysis }) {
  const { classification: c, priority } = analysis;
  return (
    <article className="space-y-6 rounded-xl border bg-card p-5 sm:p-6" aria-live="polite">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
        <h2 className="text-xl font-semibold">Report {shortId(complaint.id)} received</h2>
        <p className="text-sm text-muted-foreground">
          #{priority.rank} in the queue, priority {priority.score}/100
        </p>
      </header>

      {c.usedFallback && (
        <p className="rounded-md bg-muted p-3 text-sm">AI couldn&apos;t review this one, so a person will categorise it.</p>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium">{CATEGORY_LABELS[c.category]}</p>
          <p className="text-sm text-muted-foreground tabular-nums">{Math.round(c.confidence * 100)}% sure</p>
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
        <Rating label="Severity" value={c.severity} />
        <Rating label="Safety risk" value={c.safetyRisk} alert={c.safetyRisk >= 4} />
        <Rating label="People affected" value={c.communityImpact} />
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">Why it ranks here</h3>
        <PriorityBar breakdown={priority.breakdown} />
      </section>

      <ul className="space-y-3 text-sm">
        <li className="flex gap-2">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <DuplicateNote analysis={analysis} />
          </span>
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
