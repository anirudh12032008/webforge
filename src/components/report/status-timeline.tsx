import { Check } from "lucide-react";
import { DATE_LOCALE, statusLabels } from "@/lib/i18n/messages/labels";
import type { Locale, ReporterView, Status } from "@/types";

/** The happy path a report moves along; "rejected" is shown as a note instead of a step. */
const STEPS: Status[] = ["new", "triaged", "assigned", "in_progress", "resolved"];

const when = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleString(DATE_LOCALE[locale], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

type Props = Pick<ReporterView, "status" | "history"> & {
  locale: Locale;
  t: { progress: string; received: string; reviewedByAi: string };
};

/**
 * Horizontal progress for one report: steps up to the current status are done, with the time each
 * was reached when the history has it. Skipped steps (e.g. resolved straight from triage) still
 * count as passed so progress never looks like it went backwards.
 */
export function StatusTimeline({ status, history, locale, t }: Props) {
  const stepLabels: Record<Status, string> = { ...statusLabels(locale), new: t.received, triaged: t.reviewedByAi };
  const current = STEPS.indexOf(status);
  const reachedAt = new Map(history.map((h) => [h.status, h.at]));

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={t.progress}>
      {STEPS.map((step, i) => {
        const done = current >= 0 && i <= current;
        const at = reachedAt.get(step);
        return (
          <li key={step} className="space-y-1.5" aria-current={i === current ? "step" : undefined}>
            <span className={`flex h-1.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} aria-hidden />
            <span className={`flex items-center gap-1 text-xs ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {done && <Check className="size-3 shrink-0" aria-hidden />}
              {stepLabels[step]}
            </span>
            {done && at && <span className="block text-xs text-muted-foreground">{when(at, locale)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
