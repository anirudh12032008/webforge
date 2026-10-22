import { LOCALES, type Locale } from "@/types";

/** Cookie holding the reader's language choice; read on the server so pages render translated. */
export const LOCALE_COOKIE = "lang";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** A set of strings in every supported language; each feature area keeps its own dictionary. */
export type Dict<T> = Record<Locale, T>;

/** Picks one language's strings, falling back to English for anything not yet translated. */
export function pick<T extends object>(dict: Dict<T>, locale: Locale): T {
  return locale === DEFAULT_LOCALE ? dict.en : { ...dict.en, ...dict[locale] };
}

/** BCP 47 tag for speech recognition and date formatting. */
export const SPEECH_LANG: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };
