import type { Metadata } from "next";
import Link from "next/link";
import { PriorityMap } from "@/components/admin/priority-map";
import { TriageTable } from "@/components/admin/triage-table";
import { getDashboardStats, listComplaints, listMapPoints, SLA_HOURS } from "@/db/dashboard";
import { listComplaintsQuerySchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Triage dashboard — CampusSense" };
export const dynamic = "force-dynamic";

const ORG_TABS = [
  { slug: undefined, label: "All" },
  { slug: "manit", label: "MANIT campus" },
  { slug: "bmc", label: "Bhopal city" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = Object.fromEntries(Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string"));
  const parsed = listComplaintsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listComplaintsQuerySchema.parse({});

  const [stats, list, points] = await Promise.all([getDashboardStats(query.org), listComplaints(query), listMapPoints(query.org)]);
  const kpis = [
    { label: "Open", value: stats.open },
    { label: "Safety risk 4–5", value: stats.urgent, alert: stats.urgent > 0 },
    { label: `Waiting over ${SLA_HOURS} h`, value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Duplicate reports merged", value: stats.linkedDuplicates },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">Triage</h1>
        <nav className="flex gap-1 rounded-lg bg-muted p-1 text-sm" aria-label="Organisation">
          {ORG_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.slug ? `/dashboard?org=${tab.slug}` : "/dashboard"}
              aria-current={query.org === tab.slug ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-muted-foreground aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card p-4">
            <dt className="text-sm text-muted-foreground">{k.label}</dt>
            <dd className={`mt-1 text-3xl font-semibold tabular-nums ${k.alert ? "text-safety" : ""}`}>{k.value}</dd>
          </div>
        ))}
      </dl>

      <PriorityMap points={points} />
      <TriageTable items={list.items} total={list.total} query={query} />
    </div>
  );
}
