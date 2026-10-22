import { Skeleton } from "@/components/ui/skeleton";

/** Shown while an admin page's server data loads: header, KPI band and two panels in outline. */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8" aria-busy aria-label="Loading">
      <div className="space-y-3 border-b-2 border-foreground pb-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-foreground/90" />
      <Skeleton className="h-80 rounded-xl sm:h-[28rem]" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
