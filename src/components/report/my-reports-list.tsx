"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusTimeline } from "@/components/report/status-timeline";
import { useLocale } from "@/components/shared/locale-provider";
import { buttonVariants } from "@/components/ui/button";
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
    <article className="space-y-4 rounded-xl border bg-card p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-semibold">{report.title}</h2>
          <p className="text-sm text-muted-foreground">
            {categoryLabels(locale)[report.category]}
            {report.locationLabel ? `, ${report.locationLabel}` : ""}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">#{report.id.slice(0, 8)}</span>
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
        {[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }
  if (state.kind === "error") {
    return <p className="rounded-lg border p-4 text-sm">{t.loadError(state.message)}</p>;
  }
  if (state.reports.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t.empty}</p>
        <Link href="/report" className={buttonVariants()}>{t.reportCta}</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {state.reports.map((r) => <ReportCard key={r.id} report={r} locale={locale} t={t} />)}
    </div>
  );
}
