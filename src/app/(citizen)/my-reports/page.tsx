import type { Metadata } from "next";
import { MyReportsList } from "@/components/report/my-reports-list";
import { pick } from "@/lib/i18n";
import { MY_REPORTS } from "@/lib/i18n/messages/my-reports";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "My reports — CampusSense" };

export default async function MyReportsPage() {
  const t = pick(MY_REPORTS, await getLocale());
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">{t.pageTitle}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{t.pageIntro}</p>
      <div className="mt-8">
        <MyReportsList />
      </div>
    </div>
  );
}
