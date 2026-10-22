import type { Metadata } from "next";
import { ReportForm } from "@/components/report/report-form";
import { pick } from "@/lib/i18n";
import { REPORT } from "@/lib/i18n/messages/report";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Report an issue — CivicLens" };

export default async function ReportPage() {
  const t = pick(REPORT, await getLocale());
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">{t.pageTitle}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{t.pageIntro}</p>
      <div className="mt-8">
        <ReportForm />
      </div>
    </div>
  );
}
