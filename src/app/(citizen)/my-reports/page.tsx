import type { Metadata } from "next";
import { MyReportsList } from "@/components/report/my-reports-list";

export const metadata: Metadata = { title: "My reports — CampusSense" };

export default function MyReportsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">My reports</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Reports you submitted from this device, and where each one is now. No account needed.
      </p>
      <div className="mt-8">
        <MyReportsList />
      </div>
    </div>
  );
}
