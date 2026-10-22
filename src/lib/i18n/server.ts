import { cookies } from "next/headers";
import type { Locale } from "@/types";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./index";

/** The reader's language from the `lang` cookie (server components and route handlers only). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
