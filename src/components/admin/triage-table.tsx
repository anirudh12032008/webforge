"use client";

import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDownWideNarrow, Link2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { CATEGORY_LABELS, STATUS_LABELS, priorityBand, waitingFor } from "@/lib/labels";
import type { ListComplaintsQuery } from "@/lib/validation";
import { CATEGORIES, STATUSES, type ComplaintListItem } from "@/types";

const features = tableFeatures({});
const col = createColumnHelper<typeof features, ComplaintListItem>();

const columns = col.columns([
  col.accessor("priorityScore", {
    header: "Priority",
    cell: (info) => {
      const score = info.getValue();
      return <span className={`inline-flex min-w-11 justify-center rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${priorityBand(score).className}`}>{Math.round(score)}</span>;
    },
  }),
  col.accessor("title", {
    header: "Issue",
    cell: ({ row }) => (
      <Link href={`/complaints/${row.original.id}`} className="block max-w-md">
        <span className="font-medium hover:underline">{row.original.title}</span>
        <span className="block truncate text-sm text-muted-foreground">{row.original.locationLabel ?? row.original.orgName}</span>
      </Link>
    ),
  }),
  col.accessor("category", { header: "Category", cell: (info) => CATEGORY_LABELS[info.getValue()] }),
  col.accessor("status", { header: "Status", cell: (info) => <span className="rounded-full bg-muted px-2 py-0.5 text-sm">{STATUS_LABELS[info.getValue()]}</span> }),
  col.accessor("departmentName", { header: "Team", cell: (info) => info.getValue() ?? <span className="text-muted-foreground">Unassigned</span> }),
  col.accessor("relatedCount", {
    header: "Reports",
    cell: (info) =>
      info.getValue() > 0 ? (
        <span className="inline-flex items-center gap-1 text-sm"><Link2 className="size-3.5" aria-hidden />+{info.getValue()}</span>
      ) : null,
  }),
  col.accessor("createdAt", { header: "Waiting", cell: (info) => <span suppressHydrationWarning>{waitingFor(info.getValue())}</span> }),
]);

function FilterSelect({ name, value, options, labels, onChange }: { name: string; value?: string; options: readonly string[]; labels: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <select aria-label={name} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm">
      <option value="">{`All ${name}`}</option>
      {options.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
    </select>
  );
}

type QueueTableProps = {
  items: ComplaintListItem[];
  selected: Set<string>;
  allSelected: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
};

/**
 * The TanStack table itself. v9's useTable keeps its first `data`, so the parent keys this component
 * by row content: a router.refresh() or filter change with new rows remounts it with fresh data.
 */
function QueueTable({ items, selected, allSelected, toggle, toggleAll }: QueueTableProps) {
  const table = useTable({ features, columns, data: items, getRowId: (row) => row.id });
  return (
    <table className="w-full text-left">
      <thead className="border-b text-sm text-muted-foreground">
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            <th className="w-10 px-3 py-2">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all complaints on this page" className="size-4 accent-primary" />
            </th>
            {group.headers.map((h) => <th key={h.id} className="px-3 py-2 font-medium whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className={`border-b last:border-0 hover:bg-muted/50 ${selected.has(row.id) ? "bg-accent" : ""}`}>
            <td className="px-3 py-2.5 align-top">
              <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.original.title}`} className="size-4 accent-primary" />
            </td>
            {row.getAllCells().map((cell) => <td key={cell.id} className="px-3 py-2.5 align-top whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Triage queue. Filters, sort and page live in the URL so views are shareable and survive refresh. */
export function TriageTable({ items, total, query }: { items: ComplaintListItem[]; total: number; query: ListComplaintsQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`${pathname}?${next}`, { scroll: false });
  };
  const pages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect name="statuses" value={query.status} options={STATUSES} labels={STATUS_LABELS} onChange={(v) => setParam("status", v)} />
        <FilterSelect name="categories" value={query.category} options={CATEGORIES} labels={CATEGORY_LABELS} onChange={(v) => setParam("category", v)} />
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownWideNarrow className="size-4" aria-hidden />
          <select aria-label="Sort" value={query.sort} onChange={(e) => setParam("sort", e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm text-foreground">
            <option value="priority">Highest priority</option>
            <option value="oldest">Waiting longest</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {selected.size > 0 && <BulkActionsBar ids={[...selected]} onClear={() => setSelected(new Set())} />}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <QueueTable key={items.map((i) => `${i.id}:${i.status}:${i.priorityScore}`).join("|")} items={items} selected={selected} allSelected={allSelected} toggle={toggle} toggleAll={toggleAll} />
        {items.length === 0 && <p className="p-8 text-center text-muted-foreground">No complaints match these filters.</p>}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} complaint{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={query.page <= 1} onClick={() => setParam("page", String(query.page - 1))} className="rounded-md border px-2.5 py-1 disabled:opacity-40">Previous</button>
          <span>Page {query.page} of {pages}</span>
          <button type="button" disabled={query.page >= pages} onClick={() => setParam("page", String(query.page + 1))} className="rounded-md border px-2.5 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  );
}
