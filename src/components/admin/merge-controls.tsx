"use client";

import { Link2, Loader2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Props = { complaintId: string; duplicateOf: string | null; related: { id: string; title: string }[] };

/** Manual merge/unmerge for when the AI's duplicate detection gets it wrong; both are audited. */
export function MergeControls({ complaintId, duplicateOf, related }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState(related[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the change.");
    } finally {
      setBusy(false);
    }
  };

  if (duplicateOf) {
    return (
      <Button variant="outline" disabled={busy} onClick={() => run(() => api.unmergeComplaint(complaintId), "Unmerged")}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Unlink aria-hidden />}
        Unmerge from #{duplicateOf.slice(0, 8)}
      </Button>
    );
  }
  if (related.length === 0) return <p className="text-sm text-muted-foreground">No nearby reports to merge with.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Merge into report"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={busy}
        className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm"
      >
        {related.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
      <Button variant="outline" disabled={busy || !target} onClick={() => run(() => api.mergeComplaint(complaintId, target), "Merged as a duplicate")}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}
        Merge into
      </Button>
    </div>
  );
}
