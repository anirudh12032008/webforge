"use client";

import { Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/shared/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";

type Explanation = { explanation: string; resources: string; rank: number };
type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: Explanation };

/** On-demand "Why is this #N?" — asks Claude to explain the ranking and suggest a crew, once per view. */
export function ExplainPriority({ complaintId }: { complaintId: string }) {
  const locale = useLocale();
  const t = pick(ADMIN, locale);
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/complaints/${complaintId}/explain?lang=${locale}`);
      const body: unknown = await res.json();
      if (!res.ok) throw new Error((body as { error?: string }).error ?? t.explainUnavailable);
      setState({ kind: "ready", data: body as Explanation });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : t.explainUnavailable });
    }
  };

  if (state.kind === "ready") {
    const { explanation, resources, rank } = state.data;
    return (
      <div className="space-y-3 rounded-lg border-l-4 border-primary bg-accent p-4 text-sm" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> {t.whyRankBefore} <span className="rounded-md bg-foreground px-1.5 font-heading text-background tabular-nums">#{rank}</span> {t.whyRankAfter}
        </p>
        <p>{explanation}</p>
        <p className="flex gap-2">
          <Wrench className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">{t.suggested}</span>
            {resources}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-sm text-muted-foreground">{t.explainIntro}</p>
        <Button type="button" variant="outline" size="lg" onClick={load} disabled={state.kind === "loading"}>
          <Sparkles aria-hidden /> {state.kind === "loading" ? t.asking : state.kind === "error" ? t.tryAgain : t.explainButton}
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
