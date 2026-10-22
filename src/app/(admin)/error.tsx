"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Admin pages read live from the database; if that fails, say so and offer a retry instead of a blank page. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="hazard-band h-2" aria-hidden />
        <div className="space-y-3 p-6" role="alert">
          <p className="flex items-center gap-2 font-heading text-xl font-semibold">
            <TriangleAlert className="size-5 text-safety" aria-hidden /> Couldn&apos;t load this page
          </p>
          <p className="text-muted-foreground">The complaint data didn&apos;t come through. Check your connection and try again.</p>
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
