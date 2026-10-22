"use client";

import { createColumnHelper, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, Clock, Inbox, Link2, ListFilter, ListOrdered, MapPin, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { EmptyState, Panel, StatusChip } from "@/components/admin/console";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, STATUS_LABELS, priorityBand, waitingFor } from "@/lib/labels";
import type { ListComplaintsQuery } from "@/lib/validation";
import { CATEGORIES, STATUSES, type ComplaintListItem } from "@/types";

const features = tableFeatures({});
const col = createColumnHelper<typeof features, ComplaintListItem>();

const CLOSED = new Set(["resolved", "rejected"]);

/** Columns depend on the SLA threshold so overdue waits can be flagged in the cell. */
const makeColumns = (slaHours: number) =>
  col.columns([
    col.accessor("priorityScore", {
      header: "Priority",
      cell: (info) => {
        const score = Math.round(info.getValue());
        const band = priorityBand(score);
        return (
          <span className="flex items-center gap-2" title={`${band.label} priority`}>
            <span className={`inline-flex min-w-10 justify-center rounded-md px-1.5 py-0.5 font-heading text-sm font-semibold tabular-nums ${band.className}`}>{score}</span>
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, backgroundColor: band.hex }} />
            </span>
          </span>
        );
      },
    }),
    col.accessor("title", {
      header: "Issue",
      cell: ({ row }) => (
        <Link href={`/complaints/${row.original.id}`} className="group/title block max-w-sm min-w-56 whitespace-normal">
          <span className="font-medium group-hover/title:text-primary group-hover/title:underline underline-offset-2">{row.original.title}</span>
          <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{row.original.locationLabel ?? row.original.orgName}</span>
          </span>
        </Link>
      ),
    }),
    col.accessor("category", { header: "Category", cell: (info) => <span className="text-sm">{CATEGORY_LABELS[info.getValue()]}</span> }),
    col.accessor("status", { header: "Status", cell: (info) => <StatusChip status={info.getValue()} /> }),
    col.accessor("departmentName", {
      header: "Team",
      cell: (info) => <span className="text-sm">{info.getValue() ?? <span className="text-muted-foreground italic">Unassigned</span>}</span>,
    }),
    col.accessor("relatedCount", {
      header: "Reports",
      cell: (info) =>
        info.getValue() > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums" title={`${info.getValue()} more report(s) of this issue`}>
            <Link2 className="size-3" aria-hidden />+{info.getValue()}
          </span>
        ) : (
          <span className="text-muted-foreground">–</span>
        ),
    }),
    col.accessor("createdAt", {
      header: "Waiting",
      cell: ({ row }) => {
        const overdue = !CLOSED.has(row.original.status) && Date.now() - new Date(row.original.createdAt).getTime() > slaHours * 3_600_000;
        return (
          <span suppressHydrationWarning className={`inline-flex items-center gap-1 text-sm tabular-nums ${overdue ? "font-semibold text-safety" : ""}`} title={overdue ? `Waiting longer than ${slaHours} h` : undefined}>
            {overdue && <Clock className="size-3.5" aria-hidden />}
            {waitingFor(row.original.createdAt)}
          </span>
        );
      },
    }),
  ]);

function FilterSelect({ name, value, options, labels, onChange }: { name: string; value?: string; options: readonly string[]; labels: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <select aria-label={name} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 w-full min-w-0 rounded-lg border bg-background px-2 text-sm sm:w-auto">
      <option value="">{`All ${name}`}</option>
      {options.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
    </select>
  );
}

type QueueTableProps = {
  items: ComplaintListItem[];
  slaHours: number;
  selected: Set<string>;
  allSelected: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
};

/**
 * The TanStack table itself. v9's useTable keeps its first `data`, so the parent keys this component
 * by row content: a router.refresh() or filter change with new rows remounts it with fresh data.
 */
function QueueTable({ items, slaHours, selected, allSelected, toggle, toggleAll }: QueueTableProps) {
  const [columns] = useState(() => makeColumns(slaHours));
  const table = useTable({ features, columns, data: items, getRowId: (row) => row.id });
  const th = "sticky top-0 z-10 bg-card px-3 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase shadow-[inset_0_-1px_0_var(--border)]";
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            <th className={`${th} w-10`}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all complaints on this page" className="size-4 accent-primary" />
            </th>
            {group.headers.map((h) => <th key={h.id} className={th}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          const isSelected = selected.has(row.id);
          return (
            <tr key={row.id} aria-selected={isSelected} className="border-b transition-colors last:border-0 hover:bg-accent/60 aria-selected:bg-accent">
              <td className="px-3 py-3 align-middle">
                <input type="checkbox" checked={isSelected} onChange={() => toggle(row.id)} aria-label={`Select ${row.original.title}`} className="size-4 accent-primary" />
              </td>
              {row.getAllCells().map((cell) => <td key={cell.id} className="px-3 py-3 align-middle whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Triage queue. Filters, sort and page live in the URL so views are shareable and survive refresh. */
export function TriageTable({ items, total, query, slaHours }: { items: ComplaintListItem[]; total: number; query: ListComplaintsQuery; slaHours: number }) {
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

  const filtered = Boolean(query.status || query.category);
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    ["status", "category", "page"].forEach((k) => next.delete(k));
    router.push(`${pathname}?${next}`, { scroll: false });
  };

  const toolbar = (
    <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <ListFilter className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
      <FilterSelect name="statuses" value={query.status} options={STATUSES} labels={STATUS_LABELS} onChange={(v) => setParam("status", v)} />
      <FilterSelect name="categories" value={query.category} options={CATEGORIES} labels={CATEGORY_LABELS} onChange={(v) => setParam("category", v)} />
      {filtered && (
        <Button size="sm" variant="ghost" onClick={clearFilters} className="justify-self-start">
          <X aria-hidden /> Clear
        </Button>
      )}
      <label className="col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-2">
        <ArrowDownWideNarrow className="size-4" aria-hidden />
        <span className="sr-only">Sort</span>
        <select aria-label="Sort" value={query.sort} onChange={(e) => setParam("sort", e.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm text-foreground sm:flex-none">
          <option value="priority">Highest priority</option>
          <option value="oldest">Waiting longest</option>
          <option value="newest">Newest</option>
        </select>
      </label>
    </div>
  );

  return (
    <>
      <Panel
        icon={ListOrdered}
        title={
          <>
            Triage queue
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{total}</span>
          </>
        }
        action={toolbar}
        bodyClassName=""
      >
        <div className="max-h-[70vh] overflow-auto overscroll-x-contain">
          <QueueTable
            key={items.map((i) => `${i.id}:${i.status}:${i.priorityScore}`).join("|")}
            items={items}
            slaHours={slaHours}
            selected={selected}
            allSelected={allSelected}
            toggle={toggle}
            toggleAll={toggleAll}
          />
          {items.length === 0 && (
            <div className="p-6">
              <EmptyState icon={Inbox}>
                <span className="font-medium text-foreground">{filtered ? "No complaints match these filters." : "The queue is clear."}</span>
                {filtered && (
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </EmptyState>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground sm:px-5">
          <span className="tabular-nums">
            {items.length > 0 ? `${(query.page - 1) * query.pageSize + 1}–${(query.page - 1) * query.pageSize + items.length} of ${total}` : `0 of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={query.page <= 1} onClick={() => setParam("page", String(query.page - 1))}>
              <ChevronLeft aria-hidden /> Previous
            </Button>
            <span className="tabular-nums">
              {query.page} / {pages}
            </span>
            <Button size="sm" variant="outline" disabled={query.page >= pages} onClick={() => setParam("page", String(query.page + 1))}>
              Next <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </Panel>

      {selected.size > 0 && (
        <>
          {/* Room at the page bottom so the floating bar never covers the pager. */}
          <div className="h-16" aria-hidden />
          <BulkActionsBar ids={[...selected]} onClear={() => setSelected(new Set())} />
        </>
      )}
    </>
  );
}
