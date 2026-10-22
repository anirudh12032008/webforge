import { Bot, History, UserRound } from "lucide-react";
import { EmptyState } from "@/components/admin/console";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { AuditEntry, Category, Department, Status } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  ai_analysis: "AI analysed the report",
  status_change: "Status changed",
  assign: "Team assigned",
  category_override: "Category overridden",
};

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Human-readable "from → to" for one audited field, using labels instead of raw ids/enums. */
function describe(entry: AuditEntry, teamName: (id: unknown) => string): string | null {
  const before = entry.before ?? {};
  const after = entry.after ?? {};
  if (entry.action === "ai_analysis") {
    const category = CATEGORY_LABELS[after.category as Category] ?? "Unknown";
    const fallback = after.usedFallback ? " (fallback, needs review)" : "";
    return `${category}${fallback}, priority ${Math.round(Number(after.priorityScore))}, routed to ${teamName(after.departmentId)}`;
  }
  if ("status" in after) return `${STATUS_LABELS[before.status as Status]} → ${STATUS_LABELS[after.status as Status]}`;
  if ("category" in after) return `${CATEGORY_LABELS[before.category as Category]} → ${CATEGORY_LABELS[after.category as Category]}`;
  if ("departmentId" in after) return `${teamName(before.departmentId)} → ${teamName(after.departmentId)}`;
  return null;
}

/** Every AI decision and human override on a complaint, newest first. */
export function AuditTimeline({ entries, departments }: { entries: AuditEntry[]; departments: Department[] }) {
  const teamName = (id: unknown) => departments.find((d) => d.id === id)?.name ?? "no team";
  if (entries.length === 0) return <EmptyState icon={History}>No activity yet. AI analysis and every override will appear here.</EmptyState>;

  return (
    <ol className={`relative space-y-5 ${entries.length > 1 ? "before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-px before:bg-border" : ""}`}>
      {entries.map((entry) => {
        const isAi = entry.actor === "ai";
        const Icon = isAi ? Bot : UserRound;
        return (
          <li key={entry.id} className="relative flex gap-3">
            <span className={`relative flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${isAi ? "bg-accent text-primary" : "bg-foreground text-background"}`}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 text-sm">
              <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                <time dateTime={entry.createdAt} className="text-xs text-muted-foreground tabular-nums">{time(entry.createdAt)}</time>
              </p>
              <p className="text-muted-foreground">{describe(entry, teamName)}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{isAi ? "AI" : entry.actor}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
