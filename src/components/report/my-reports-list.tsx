"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusTimeline } from "@/components/report/status-timeline";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getRememberedReportIds } from "@/lib/my-reports";
import type { ReporterView } from "@/types";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; reports: ReporterView[] };

function ReportCard({ report }: { report: ReporterView }) {
  return (
    <article className="space-y-4 rounded-xl border bg-card p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-semibold">{report.title}</h2>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_LABELS[report.category]}
            {report.locationLabel ? `, ${report.locationLabel}` : ""}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">#{report.id.slice(0, 8)}</span>
      </header>
      {report.status === "rejected" ? (
        <p className="rounded-md bg-muted p-3 text-sm">This report was closed without action. It may have been outside the team&apos;s responsibility.</p>
      ) : (
        <StatusTimeline status={report.status} history={report.history} />
      )}
      <p className="text-sm text-muted-foreground">
        {report.duplicateOf
          ? `Merged with an earlier report of the same issue (#${report.duplicateOf.slice(0, 8)}), which moved it up the queue.`
          : report.departmentName
            ? `Handled by ${report.departmentName}.`
            : "Waiting for a team to be assigned."}
      </p>
    </article>
  );
}

/** Lists the reports this device submitted, read via ids saved in localStorage at submit time. */
export function MyReportsList() {
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
    return <p className="rounded-lg border p-4 text-sm">Couldn&apos;t load your reports: {state.message}. Refresh to try again.</p>;
  }
  if (state.reports.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">You haven&apos;t reported anything from this device yet.</p>
        <Link href="/report" className={buttonVariants()}>Report an issue</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {state.reports.map((r) => <ReportCard key={r.id} report={r} />)}
    </div>
  );
}
