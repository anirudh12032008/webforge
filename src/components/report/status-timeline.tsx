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
    <ol className="grid gap-2 sm:grid-cols-5 sm:gap-1" aria-label={t.progress}>
      {STEPS.map((step, i) => {
        const done = current >= 0 && i <= current;
        const at = reachedAt.get(step);
        return (
          // Vertical list on phones (five columns don't fit labels plus times at 375px), a bar across from sm up.
          <li key={step} className="flex items-center gap-3 sm:block sm:space-y-1.5" aria-current={i === current ? "step" : undefined}>
            <span className={`block h-6 w-1.5 shrink-0 rounded-full sm:h-1.5 sm:w-full ${done ? "bg-primary" : "bg-muted"} ${i === current ? "ring-2 ring-primary/25" : ""}`} aria-hidden />
            <span className={`flex items-center gap-1 text-sm sm:text-xs ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {done && <Check className="size-3.5 shrink-0 sm:size-3" aria-hidden />}
              {stepLabels[step]}
            </span>
            {done && at && <span className="ml-auto text-xs text-muted-foreground tabular-nums sm:ml-0 sm:block">{when(at, locale)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
