"use client";

import { Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/shared/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Explanation = { explanation: string; resources: string; rank: number };
type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: Explanation };

/** On-demand "Why is this #N?" — asks Claude to explain the ranking and suggest a crew, once per view. */
export function ExplainPriority({ complaintId }: { complaintId: string }) {
  const locale = useLocale();
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/complaints/${complaintId}/explain?lang=${locale}`);
      const body: unknown = await res.json();
      if (!res.ok) throw new Error((body as { error?: string }).error ?? "Explanation unavailable.");
      setState({ kind: "ready", data: body as Explanation });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Explanation unavailable." });
    }
  };

  if (state.kind === "ready") {
    const { explanation, resources, rank } = state.data;
    return (
      <div className="space-y-3 rounded-lg border-l-4 border-primary bg-accent p-4 text-sm" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> Why this is <span className="rounded-md bg-foreground px-1.5 font-heading text-background tabular-nums">#{rank}</span> in the queue
        </p>
        <p>{explanation}</p>
        <p className="flex gap-2">
          <Wrench className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">Suggested resources: </span>
            {resources}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-sm text-muted-foreground">Ask the AI why this complaint sits at its place in the queue and which crew to send.</p>
        <Button type="button" variant="outline" size="lg" onClick={load} disabled={state.kind === "loading"}>
          <Sparkles aria-hidden /> {state.kind === "loading" ? "Asking the AI…" : state.kind === "error" ? "Try again" : "Why this rank?"}
        </Button>
      </div>
      {state.kind === "loading" && (
        <div className="space-y-2" aria-busy>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {state.kind === "error" && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
    </div>
  );
}
