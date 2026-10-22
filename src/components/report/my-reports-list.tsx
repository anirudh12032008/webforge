"use client";

import { AlertTriangle, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusTimeline } from "@/components/report/status-timeline";
import { useLocale } from "@/components/shared/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { pick } from "@/lib/i18n";
import { categoryLabels, departmentName } from "@/lib/i18n/messages/labels";
import { MY_REPORTS } from "@/lib/i18n/messages/my-reports";
import { getRememberedReportIds } from "@/lib/my-reports";
import type { Locale, ReporterView } from "@/types";

type Copy = (typeof MY_REPORTS)["en"];

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; reports: ReporterView[] };

function ReportCard({ report, locale, t }: { report: ReporterView; locale: Locale; t: Copy }) {
  return (
    <article className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3 border-b border-dashed pb-3">
        <div className="min-w-0">
          <h2 className="leading-snug font-semibold text-pretty">{report.title}</h2>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            {categoryLabels(locale)[report.category]}
            {report.locationLabel ? `, ${report.locationLabel}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">#{report.id.slice(0, 8)}</span>
      </header>
      {report.status === "rejected" ? (
        <p className="rounded-md bg-muted p-3 text-sm">{t.rejected}</p>
      ) : (
        <StatusTimeline status={report.status} history={report.history} locale={locale} t={t} />
      )}
      <p className="text-sm text-muted-foreground">
        {report.duplicateOf
          ? t.merged(report.duplicateOf.slice(0, 8))
          : report.departmentName
            ? t.handledBy(departmentName(locale, report.departmentName))
            : t.awaitingTeam}
      </p>
    </article>
  );
}

/** Lists the reports this device submitted, read via ids saved in localStorage at submit time. */
export function MyReportsList() {
  const locale = useLocale();
  const t = pick(MY_REPORTS, locale);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const ids = getRememberedReportIds();
    if (ids.length === 0) return setState({ kind: "ready", reports: [] });
    api
      .myReports(ids)
      .then((reports) => setState({ kind: "ready", reports }))
      .catch((err: Error) => setState({ kind: "error", message: err.message }));
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex justify-between gap-3 border-b border-dashed pb-3">
              <div className="w-2/3 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        ))}
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <p role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {t.loadError(state.message)}
      </p>
    );
  }
  if (state.reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed bg-card/60 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-foreground text-signal" aria-hidden>
          <ClipboardList className="size-6" />
        </span>
        <p className="max-w-xs text-pretty text-muted-foreground">{t.empty}</p>
        <Link href="/report" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>{t.reportCta}</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {state.reports.map((r, i) => (
        <div key={r.id} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both motion-reduce:animate-none" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
          <ReportCard report={r} locale={locale} t={t} />
        </div>
      ))}
    </div>
  );
}
