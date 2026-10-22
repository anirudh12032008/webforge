import { ArrowLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { OverrideControls } from "@/components/admin/override-controls";
import { PriorityBar } from "@/components/shared/priority-bar";
import { getComplaintDetail, type LinkedReport } from "@/db/complaint-detail";
import { CATEGORY_LABELS, STATUS_LABELS, priorityBand, waitingFor } from "@/lib/labels";

export const metadata: Metadata = { title: "Complaint — CampusSense" };
export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function LinkedList({ items, empty }: { items: LinkedReport[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((r) => (
        <li key={r.id} className="flex items-baseline justify-between gap-3">
          <Link href={`/complaints/${r.id}`} className="truncate hover:underline">{r.title}</Link>
          <span className="shrink-0 text-muted-foreground">
            {r.similarity !== undefined ? `${Math.round(r.similarity * 100)}% similar` : STATUS_LABELS[r.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function ComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  const detail = id.success ? await getComplaintDetail(id.data) : null;
  if (!detail) notFound();
  const { complaint: c, org, orgDepartments, duplicates, related, audit } = detail;
  const band = priorityBand(c.priorityScore);
  const usedFallback = audit.some((a) => a.action === "ai_analysis" && a.after?.usedFallback === true);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Back to triage
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <span className={`rounded-lg px-3 py-2 text-2xl font-semibold tabular-nums ${band.className}`} title={`${band.label} priority`}>
          {Math.round(c.priorityScore)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{c.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {c.locationLabel ?? `${c.location.lat.toFixed(5)}, ${c.location.lng.toFixed(5)}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {org.name}. {STATUS_LABELS[c.status]}, reported <span suppressHydrationWarning>{waitingFor(c.createdAt)}</span> ago
            {c.reporterName ? ` by ${c.reporterName}` : ""}.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Section title="Report">
            {c.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded Blob URL, arbitrary size
              <img src={c.photoUrl} alt={`Photo of ${c.title}`} className="max-h-96 w-full rounded-lg border object-cover" />
            )}
            <p className="whitespace-pre-line">{c.description}</p>
          </Section>

          <Section title="AI assessment">
            {usedFallback && <p className="rounded-md bg-muted p-3 text-sm">The AI couldn&apos;t classify this report. Set the category below.</p>}
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-medium">{CATEGORY_LABELS[c.category]}</p>
              {c.categoryConfidence !== null && <p className="text-sm text-muted-foreground">{Math.round(c.categoryConfidence * 100)}% sure</p>}
            </div>
            {c.aiReasoning && (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                {c.aiReasoning}
              </p>
            )}
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-muted-foreground">Severity</dt><dd className="text-lg font-semibold">{c.severity ?? "–"}/5</dd></div>
              <div><dt className="text-muted-foreground">Safety risk</dt><dd className={`text-lg font-semibold ${(c.safetyRisk ?? 0) >= 4 ? "text-safety" : ""}`}>{c.safetyRisk ?? "–"}/5</dd></div>
              <div><dt className="text-muted-foreground">People affected</dt><dd className="text-lg font-semibold">{c.communityImpact ?? "–"}/5</dd></div>
            </dl>
            {c.priorityBreakdown && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium">Why it scores {Math.round(c.priorityScore)}</h3>
                <PriorityBar breakdown={c.priorityBreakdown} />
              </div>
            )}
          </Section>

          <Section title={`Duplicate reports (${duplicates.length})`}>
            <LinkedList items={duplicates} empty="Nobody else has reported this exact issue." />
          </Section>
          <Section title={`Related nearby (${related.length})`}>
            <LinkedList items={related} empty="No similar reports within 75 m in the last 30 days." />
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Actions">
            <OverrideControls complaintId={c.id} status={c.status} category={c.category} departmentId={c.departmentId} departments={orgDepartments} />
          </Section>
          <Section title="Activity">
            <AuditTimeline entries={audit} departments={orgDepartments} />
          </Section>
        </aside>
      </div>
    </div>
  );
}
