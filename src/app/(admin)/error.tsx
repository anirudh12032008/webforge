"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useLocale } from "@/components/shared/locale-provider";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";

/** Admin pages read live from the database; if that fails, say so and offer a retry instead of a blank page. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = pick(ADMIN, useLocale());
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="hazard-band h-2" aria-hidden />
        <div className="space-y-3 p-6" role="alert">
          <p className="flex items-center gap-2 font-heading text-xl font-semibold">
            <TriangleAlert className="size-5 text-safety" aria-hidden /> {t.errorTitle}
          </p>
          <p className="text-muted-foreground">{t.errorBody}</p>
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden /> {t.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
