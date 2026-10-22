import { FACTOR_LABELS } from "@/lib/labels";
import type { PriorityFactor } from "@/types";

const FACTOR_COLORS: Record<PriorityFactor["factor"], string> = {
  safety: "bg-safety",
  severity: "bg-foreground",
  related: "bg-primary",
  waiting: "bg-muted-foreground",
  community: "bg-chart-5",
};

/** Stacked 0–100 bar: each segment is one factor's contribution, so the score explains itself. */
export function PriorityBar({ breakdown, labels = FACTOR_LABELS }: { breakdown: PriorityFactor[]; labels?: Record<PriorityFactor["factor"], string> }) {
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Priority breakdown">
        {breakdown.map((f) => (
          <div key={f.factor} className={FACTOR_COLORS[f.factor]} style={{ width: `${f.contribution}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {breakdown.map((f) => (
          <div key={f.factor} className="flex items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ${FACTOR_COLORS[f.factor]}`} aria-hidden />
            <dt className="text-muted-foreground">{labels[f.factor]}</dt>
            <dd className="ml-auto font-medium tabular-nums">+{f.contribution}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
