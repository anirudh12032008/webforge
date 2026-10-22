"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/labels";
import { STATUSES, type Status } from "@/types";

/** Floating bar pinned to the bottom of the viewport while rows are selected: apply one status to all, or clear. */
export function BulkActionsBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("in_progress");
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    setSaving(true);
    try {
      const updated = await api.bulkStatus({ ids, status });
      toast.success(`${updated} complaint${updated === 1 ? "" : "s"} set to ${STATUS_LABELS[status]}`);
      onClear();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the complaints.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl flex-wrap items-center gap-2 overflow-hidden rounded-xl bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-[0_16px_40px_-12px_rgb(31_35_40/0.6)] ring-1 ring-background/10"
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-signal" aria-hidden />
      <span className="font-semibold tabular-nums">{ids.length} selected</span>
      <label className="ml-auto flex items-center gap-2 text-background/80">
        <span className="hidden sm:inline">Set status</span>
        <select
          aria-label="New status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          disabled={saving}
          className="h-8 rounded-lg border border-background/30 bg-foreground px-2 text-background"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </label>
      <Button size="sm" variant="secondary" onClick={apply} disabled={saving}>
        {saving && <Loader2 className="animate-spin" aria-hidden />}
        Apply
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={onClear} aria-label="Clear selection" className="text-background hover:bg-background/10 hover:text-background">
        <X />
      </Button>
    </div>
  );
}
