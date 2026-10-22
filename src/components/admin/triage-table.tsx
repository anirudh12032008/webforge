"use client";

import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDownWideNarrow, Link2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

/** Triage queue. Filters, sort and page live in the URL so views are shareable and survive refresh. */
export function TriageTable({ items, total, query }: { items: ComplaintListItem[]; total: number; query: ListComplaintsQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const table = useTable({ features, columns, data: items, getRowId: (row) => row.id });

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

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left">
          <thead className="border-b text-sm text-muted-foreground">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((h) => <th key={h.id} className="px-3 py-2 font-medium whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50">
                {row.getAllCells().map((cell) => <td key={cell.id} className="px-3 py-2.5 align-top whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
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
