"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext } from "react";
import { LOCALE_COOKIE } from "@/lib/i18n";
import type { Locale } from "@/types";

const LocaleContext = createContext<Locale>("en");

/** Makes the server-resolved locale available to client components without a second lookup. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Stores the choice in a cookie (1 year) and re-renders server components in the new language. */
export function useSetLocale(): (locale: Locale) => void {
  const router = useRouter();
  return useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );
}
