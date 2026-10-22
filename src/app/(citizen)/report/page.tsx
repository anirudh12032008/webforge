import type { Metadata } from "next";
import { ReportForm } from "@/components/report/report-form";

export const metadata: Metadata = { title: "Report an issue — CampusSense" };

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Report an issue</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Pin where it is and describe what&apos;s wrong. A photo helps. AI sorts your report, checks whether it&apos;s
        already been reported, and sends it to the team that can fix it.
      </p>
      <div className="mt-8">
        <ReportForm />
      </div>
    </div>
  );
}
