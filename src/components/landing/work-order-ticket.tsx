import { Building2, Sparkles } from "lucide-react";
import { PriorityBar } from "@/components/shared/priority-bar";
import { CATEGORY_LABELS, priorityBand } from "@/lib/labels";
import type { Category, PriorityFactor } from "@/types";

export type TicketData = {
  ref: string;
  title: string;
  location: string | null;
  category: Category;
  priorityScore: number;
  reasoning: string | null;
  breakdown: PriorityFactor[] | null;
  team: string | null;
};

type Labels = { ticketLabel: string; ticketLive: string; ticketExample: string; ticketRouted: string; ticketUnassigned: string; ticketPriority: string };

/**
 * A complaint rendered as a municipal work order: hazard-striped header band, big priority figure
 * in its band colour, the AI's one-line reason and the factor breakdown, and a tear-off edge.
 * `live` marks real queue data versus the static fallback example.
 */
export function WorkOrderTicket({ ticket, live, labels }: { ticket: TicketData; live: boolean; labels: Labels }) {
  const band = priorityBand(ticket.priorityScore);
  return (
    <article className="ticket-enter relative mx-auto w-full max-w-lg -rotate-1 rounded-t-xl bg-card shadow-[0_24px_48px_-20px_rgb(31_35_40/0.35)] ring-1 ring-border">
      <div className="hazard-band h-3 rounded-t-xl" aria-hidden />
      <header className="flex items-start justify-between gap-4 border-b border-dashed px-5 pt-4 pb-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {labels.ticketLabel} #{ticket.ref}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`live-dot size-2 rounded-full ${live ? "bg-safety" : "bg-muted-foreground"}`} aria-hidden />
            {live ? labels.ticketLive : labels.ticketExample}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{labels.ticketPriority}</p>
          <p className={`mt-0.5 inline-block rounded-md px-2.5 py-1 font-heading text-3xl font-semibold tabular-nums ${band.className}`}>
            {Math.round(ticket.priorityScore)}
          </p>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        <div>
          <h2 className="text-lg leading-snug font-semibold">{ticket.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {CATEGORY_LABELS[ticket.category]}
            {ticket.location ? `, ${ticket.location}` : ""}
          </p>
        </div>
        {ticket.reasoning && (
          <p className="flex gap-2 rounded-lg bg-accent px-3 py-2 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {ticket.reasoning}
          </p>
        )}
        {ticket.breakdown && <PriorityBar breakdown={ticket.breakdown} />}
        <p className="flex items-center gap-2 border-t pt-3 text-sm">
          <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {ticket.team ? (
            <span>
              {labels.ticketRouted} <strong className="font-semibold">{ticket.team}</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">{labels.ticketUnassigned}</span>
          )}
        </p>
      </div>
      <div className="perforated -mb-2 bg-card" aria-hidden />
    </article>
  );
}
