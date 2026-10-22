"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { PatchComplaintInput } from "@/lib/validation";
import { CATEGORIES, STATUSES, type Category, type Department, type Status } from "@/types";

type Props = {
  complaintId: string;
  status: Status;
  category: Category;
  departmentId: number | null;
  departments: Department[];
};

const FIELD_NAMES: Record<keyof PatchComplaintInput, string> = { status: "Status", category: "Category", departmentId: "Team" };

/** Status, team and category overrides. Each change saves immediately and lands in the audit trail. */
export function OverrideControls({ complaintId, status, category, departmentId, departments }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState<keyof PatchComplaintInput | null>(null);

  const save = async (patch: PatchComplaintInput) => {
    const field = Object.keys(patch)[0] as keyof PatchComplaintInput;
    setSaving(field);
    try {
      await api.updateComplaint(complaintId, patch);
      toast.success(`${FIELD_NAMES[field]} updated`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the change.");
    } finally {
      setSaving(null);
    }
  };

  const field = "h-9 w-full rounded-lg border bg-background px-2 text-sm transition-colors hover:border-foreground/40 disabled:opacity-60";
  const label = (name: keyof PatchComplaintInput, text: string) => (
    <span className="flex items-center gap-2 text-sm font-medium">
      {text}
      {saving === name && <Loader2 className="size-3.5 animate-spin" aria-label="Saving" />}
    </span>
  );

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        {label("status", "Status")}
        <select className={field} value={status} disabled={saving !== null} onChange={(e) => save({ status: e.target.value as Status })}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5">
        {label("departmentId", "Assigned team")}
        <select
          className={field}
          value={departmentId ?? ""}
          disabled={saving !== null}
          onChange={(e) => save({ departmentId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Unassigned</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5">
        {label("category", "Category")}
        <select className={field} value={category} disabled={saving !== null} onChange={(e) => save({ category: e.target.value as Category })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <span className="block text-xs text-muted-foreground">Changing the category overrides the AI and is recorded in Activity.</span>
      </label>
    </div>
  );
}
