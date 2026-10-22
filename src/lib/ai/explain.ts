import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, asc, desc, eq, gt, isNull, lt, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { getComplaint, getOpenRank } from "@/db/queries";
import { complaints, departments } from "@/db/schema";
import { env } from "@/env";
import type { Locale } from "@/types";

const MODEL = "claude-opus-5-5";
const CLOSED: ("resolved" | "rejected")[] = ["resolved", "rejected"];

const outputSchema = z.object({ explanation: z.string(), resources: z.string() });
export type PriorityExplanation = z.infer<typeof outputSchema> & { rank: number };

const SYSTEM_PROMPT = `You explain a civic maintenance queue to a municipal or campus maintenance supervisor in Bhopal.
Given one complaint, its priority breakdown and its neighbours in the open queue, write:
- explanation: 3 short plain sentences. Say why it ranks where it does, citing the 1–2 biggest factors with their numbers from the breakdown, and what would move it up or down (e.g. more reports nearby, waiting past 72 h, a safety re-rating). No hype, no bullet points.
- resources: one line of concrete crew/tools/time, e.g. "1 electrician, insulated tools, cordon tape; ~2 h".`;

const LANGUAGE: Record<Locale, string> = { en: "English", hi: "Hindi (Devanagari script)" };

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 1 }));

const neighbourFields = { title: complaints.title, priorityScore: complaints.priorityScore };

/** The (up to) 2 open complaints directly above and below a score in the same org's queue. */
async function neighbours(id: string, orgId: number, score: number) {
  const open = and(eq(complaints.orgId, orgId), notInArray(complaints.status, CLOSED), isNull(complaints.duplicateOf), ne(complaints.id, id));
  const [above, below] = await Promise.all([
    db.select(neighbourFields).from(complaints).where(and(open, gt(complaints.priorityScore, score))).orderBy(asc(complaints.priorityScore)).limit(2),
    db.select(neighbourFields).from(complaints).where(and(open, lt(complaints.priorityScore, score))).orderBy(desc(complaints.priorityScore)).limit(2),
  ]);
  return { above: above.reverse(), below };
}

/**
 * "Why is this #N?": gathers the complaint, its rank and queue neighbours, and asks Claude for a
 * short supervisor-facing explanation plus a resource suggestion as structured JSON. Returns null
 * (never throws) when the complaint is missing, the model refuses, or the call fails.
 */
export async function explainPriority(id: string, locale: Locale = "en"): Promise<PriorityExplanation | null> {
  try {
    return await explain(id, locale);
  } catch (err) {
    console.warn("[explain] unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function explain(id: string, locale: Locale): Promise<PriorityExplanation | null> {
  const row = await getComplaint(id);
  if (!row) return null;
  const [rank, around, [team]] = await Promise.all([
    getOpenRank(row.orgId, row.priorityScore),
    neighbours(id, row.orgId, row.priorityScore),
    row.departmentId ? db.select({ name: departments.name }).from(departments).where(eq(departments.id, row.departmentId)) : Promise.resolve([]),
  ]);

  const facts = {
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    team: team?.name ?? "unassigned",
    severity: row.severity,
    safetyRisk: row.safetyRisk,
    communityImpact: row.communityImpact,
    relatedReports: row.relatedCount,
    waitingHours: Math.round((Date.now() - row.createdAt.getTime()) / 3_600_000),
    priorityScore: row.priorityScore,
    priorityBreakdown: row.priorityBreakdown,
    openQueueRank: rank,
    rankedAbove: around.above,
    rankedBelow: around.below,
  };

  const message = await getClient().beta.messages.parse({
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low", format: zodOutputFormat(outputSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${JSON.stringify(facts)}\n\nAnswer in ${LANGUAGE[locale]}.` }],
    });
  if (message.stop_reason === "refusal" || !message.parsed_output) return null;
  return { ...message.parsed_output, rank };
}
