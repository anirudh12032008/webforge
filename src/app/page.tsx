import { GitBranch } from "lucide-react";
import Link from "next/link";
import { LANDING_COPY } from "@/components/landing/landing-copy";
import { WorkOrderTicket, type TicketData } from "@/components/landing/work-order-ticket";
import { buttonVariants } from "@/components/ui/button";
import { getAnalytics } from "@/db/analytics";
import { getDashboardStats, listComplaints } from "@/db/dashboard";
import { getComplaint } from "@/db/queries";
import { pick } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { listComplaintsQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const EXAMPLE_TICKET: TicketData = {
  ref: "a7f3c2e1",
  title: "Exposed wires on lamp post at sports complex",
  location: "Sports complex, MANIT",
  category: "electrical",
  priorityScore: 74,
  reasoning: "Live wires hanging at knee height where children play — immediate shock risk.",
  breakdown: [
    { factor: "safety", weight: 0.35, raw: 5, normalized: 1, contribution: 35 },
    { factor: "severity", weight: 0.25, raw: 4, normalized: 0.75, contribution: 18.8 },
    { factor: "related", weight: 0.2, raw: 2, normalized: 0.4, contribution: 8 },
    { factor: "waiting", weight: 0.1, raw: 30, normalized: 0.42, contribution: 4.2 },
    { factor: "community", weight: 0.1, raw: 4, normalized: 0.75, contribution: 7.5 },
  ],
  team: "MANIT Electrical Maintenance",
};

/** Highest-priority open complaint as a ticket, or null so the page falls back to the example. */
async function loadLiveTicket(): Promise<TicketData | null> {
  const { items } = await listComplaints(listComplaintsQuerySchema.parse({ sort: "priority", pageSize: 10 }));
  const top = items.find((c) => c.status !== "resolved" && c.status !== "rejected");
  const row = top && (await getComplaint(top.id));
  if (!top || !row) return null;
  return {
    ref: top.id.slice(0, 8),
    title: top.title,
    location: top.locationLabel,
    category: top.category,
    priorityScore: top.priorityScore,
    reasoning: row.aiReasoning,
    breakdown: row.priorityBreakdown,
    team: top.departmentName,
  };
}

/** Live data for the hero; any database hiccup degrades to the static example and no numbers. */
async function loadLanding() {
  try {
    const [ticket, stats, analytics] = await Promise.all([loadLiveTicket(), getDashboardStats(), getAnalytics()]);
    return { ticket, stats: { ...stats, resolved: analytics.summary.resolved } };
  } catch (err) {
    console.error("[landing] live data unavailable", err);
    return { ticket: null, stats: null };
  }
}

export default async function Home() {
  const [locale, { ticket, stats }] = await Promise.all([getLocale(), loadLanding()]);
  const t = pick(LANDING_COPY, locale);
  const numbers = stats && [
    { value: stats.open, label: t.statsOpen },
    { value: stats.urgent, label: t.statsUrgent, alert: true },
    { value: stats.linkedDuplicates, label: t.statsMerged },
    { value: stats.resolved, label: t.statsResolved },
  ];

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:gap-12 sm:pt-20 sm:pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <h1 className="text-[2.5rem] leading-[1.1] font-semibold text-balance sm:text-5xl lg:text-6xl">{t.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:mt-6 sm:text-lg">{t.heroBody}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/report" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base shadow-sm")}>
              {t.ctaReport}
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 border-foreground/25 px-6 text-base")}>
              {t.ctaDashboard}
            </Link>
          </div>
        </div>
        <WorkOrderTicket ticket={ticket ?? EXAMPLE_TICKET} live={ticket !== null} labels={t} />
      </section>

      {numbers && (
        <section className="bg-foreground text-background">
          <div className="road-line" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 py-10">
            <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {numbers.map((n) => (
                <div key={n.label} className="border-l-4 border-signal pl-4">
                  <dd className={`font-heading text-4xl font-semibold tabular-nums sm:text-5xl ${n.alert ? "text-signal" : ""}`}>{n.value}</dd>
                  <dt className="mt-1 text-sm text-background/75">{n.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm text-background/60">{t.statsNote}</p>
          </div>
          <div className="road-line" aria-hidden />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <h2 className="max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">{t.stepsTitle}</h2>
        <ol className="relative mt-10 grid gap-8 md:mt-12 md:grid-cols-4 md:gap-6">
          <div className="road-line absolute top-6 right-0 left-0 hidden md:block" aria-hidden />
          {t.steps.map((step, i) => (
            // Number beside the text on phones, above it on the 4-column row from md up.
            <li key={step.title} className="relative grid grid-cols-[auto_1fr] gap-x-4 md:block">
              <span className="relative row-span-2 flex size-11 items-center justify-center rounded-full bg-foreground font-heading text-lg font-semibold text-signal ring-4 ring-background md:size-12 md:text-xl">
                {i + 1}
              </span>
              <h3 className="self-center text-lg font-semibold md:mt-5">{step.title}</h3>
              <p className="mt-1.5 text-muted-foreground md:mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-20">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="p-6 sm:p-10">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.orgsTitle}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t.orgsBody}</p>
          </div>
          <div className="grid border-t md:grid-cols-[1fr_auto_1fr]">
            <div className="p-6 sm:p-10">
              <p className="font-heading text-2xl font-semibold text-primary">{t.campusName}</p>
              <p className="mt-2 text-muted-foreground">{t.campusBody}</p>
            </div>
            <div className="flex items-center justify-center bg-signal px-6 py-3 font-heading text-lg font-semibold text-foreground md:px-4">
              {t.orgsOr}
            </div>
            <div className="p-6 sm:p-10">
              <p className="font-heading text-2xl font-semibold">{t.cityName}</p>
              <p className="mt-2 text-muted-foreground">{t.cityBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-accent/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:gap-10 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl">{t.trustTitle}</h2>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {t.trust.map((item) => (
              <div key={item.title} className="border-t-2 border-foreground pt-4">
                <dt className="font-semibold">{item.title}</dt>
                <dd className="mt-1 text-muted-foreground">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground">
        <p>{t.footerBuilt}</p>
        <a href="https://github.com/anirudh12032008/webforge" className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground">
          <GitBranch className="size-4" aria-hidden />
          {t.footerCode}
        </a>
      </footer>
    </>
  );
}
