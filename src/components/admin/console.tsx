import type { LucideIcon } from "lucide-react";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { statusLabels } from "@/lib/i18n/messages/labels";
import { waitingFor } from "@/lib/labels";
import type { Locale, Status } from "@/types";

const STATUS_STYLES: Record<Status, { chip: string; dot: string }> = {
  new: { chip: "border-signal/60 bg-signal/15", dot: "bg-signal" },
  triaged: { chip: "border-chart-5/50 bg-chart-5/10", dot: "bg-chart-5" },
  assigned: { chip: "border-primary/30 bg-accent", dot: "bg-primary" },
  in_progress: { chip: "border-primary bg-primary text-primary-foreground", dot: "bg-signal" },
  resolved: { chip: "border-border bg-muted", dot: "bg-foreground" },
  rejected: { chip: "border-border bg-transparent text-muted-foreground line-through decoration-muted-foreground/50", dot: "bg-muted-foreground" },
};

/** Workflow status pill: colour + dot so the queue can be scanned without reading every label. */
export function StatusChip({ status, locale }: { status: Status; locale: Locale }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${s.chip}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />
      {statusLabels(locale)[status]}
    </span>
  );
}

/** Admin page header: live eyebrow, title, one-line purpose, and actions (org tabs, export) on the right. */
export function ConsoleHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b-2 border-foreground pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <span className="live-dot size-2 rounded-full bg-safety" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-1 max-w-xl text-pretty text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 md:justify-end">{children}</div>}
    </header>
  );
}

export type Kpi = { label: string; value: React.ReactNode; hint?: string; alert?: boolean };

/** Dark "asphalt" KPI band (same language as the landing stats): alert tiles get a signal-yellow rule and value. */
export function KpiStrip({ items, locale }: { items: Kpi[]; locale: Locale }) {
  return (
    <section aria-label={pick(ADMIN, locale).keyNumbers} className="overflow-hidden rounded-xl bg-foreground text-background shadow-sm">
      <div className="road-line" aria-hidden />
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-5 p-4 sm:p-5 ${items.length > 4 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
        {items.map((k) => (
          <div key={k.label} className={`min-w-0 border-l-4 pl-3 ${k.alert ? "border-signal" : "border-background/20"}`}>
            <dt className="text-xs font-medium tracking-wide text-background/70 uppercase">{k.label}</dt>
            <dd className={`mt-1 font-heading text-3xl font-semibold tabular-nums sm:text-4xl ${k.alert ? "text-signal" : ""}`}>{k.value}</dd>
            {k.hint && <dd className="mt-0.5 text-xs text-background/60">{k.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Card with a titled header bar; `action` sits on the right of the header. */
export function Panel({
  title,
  icon: Icon,
  description,
  action,
  children,
  className = "",
  bodyClassName = "p-4 sm:p-5",
}: {
  title: React.ReactNode;
  icon?: LucideIcon;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-muted/40 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Dashed placeholder for "nothing here yet" states. */
export function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      <Icon className="size-5" aria-hidden />
      {children}
    </div>
  );
}

/** "5 h" / "3 d" waiting time in the reader's language. */
export function waiting(iso: string, locale: Locale): string {
  const t = pick(ADMIN, locale);
  return waitingFor(iso).replace(" h", ` ${t.hours}`).replace(" d", ` ${t.days}`);
}

/** "5 h ago" / "just now" for relative timestamps. */
export function ago(iso: string, locale: Locale): string {
  const t = pick(ADMIN, locale);
  return waitingFor(iso) === "0 h" ? t.justNow : t.ago(waiting(iso, locale));
}
