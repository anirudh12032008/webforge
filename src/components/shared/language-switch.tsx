"use client";

import { useLocale, useSetLocale } from "@/components/shared/locale-provider";
import type { Locale } from "@/types";

const OPTIONS: { locale: Locale; label: string; name: string }[] = [
  { locale: "en", label: "EN", name: "English" },
  { locale: "hi", label: "हिं", name: "हिन्दी" },
];

/** EN | हिं toggle; the choice is stored in a cookie so server-rendered pages switch too. */
export function LanguageSwitch({ label }: { label: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-md border bg-background p-0.5 text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.locale}
          type="button"
          lang={o.locale}
          aria-pressed={locale === o.locale}
          aria-label={o.name}
          onClick={() => locale !== o.locale && setLocale(o.locale)}
          className="rounded px-2 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
