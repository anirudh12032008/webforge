import { STATUSES, type Status } from "@/types";

type AuditLike = { action: string; after: Record<string, unknown> | null; createdAt: string };

const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

/**
 * Public status history for a reporter: "new" at submission, then each status the complaint moved
 * to, read from the audit trail (the AI analysis counts as the move to its recorded status).
 * Consecutive repeats are collapsed so a no-op never shows up as a step.
 */
export function buildStatusHistory(createdAt: string, audit: AuditLike[]): { status: Status; at: string }[] {
  const history: { status: Status; at: string }[] = [{ status: "new", at: createdAt }];
  for (const entry of [...audit].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const next = entry.after?.status;
    if ((entry.action === "status_change" || entry.action === "ai_analysis") && isStatus(next) && next !== history.at(-1)?.status) {
      history.push({ status: next, at: entry.createdAt });
    }
  }
  return history;
}
