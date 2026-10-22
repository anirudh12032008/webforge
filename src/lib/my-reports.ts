const IDS_KEY = "campussense:report-ids";
const CONTACT_KEY = "campussense:contact";

/** Remembers a submitted report on this device so /my-reports can list it without an account. */
export function rememberReport(id: string, contact: string | null): void {
  try {
    const ids = getRememberedReportIds().filter((existing) => existing !== id);
    localStorage.setItem(IDS_KEY, JSON.stringify([id, ...ids].slice(0, 50)));
    if (contact) localStorage.setItem(CONTACT_KEY, contact);
  } catch {
    // Private mode or storage disabled: the report is still saved server-side.
  }
}

export function getRememberedReportIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(IDS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function getRememberedContact(): string {
  try {
    return localStorage.getItem(CONTACT_KEY) ?? "";
  } catch {
    return "";
  }
}
