import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "@/env";
import { CATEGORIES, type Classification } from "@/types";

export const CLASSIFIER_MODEL = "claude-sonnet-4-5";

const outputSchema = z.object({
  category: z.enum(CATEGORIES),
  confidence: z.number(),
  severity: z.number(),
  safetyRisk: z.number(),
  communityImpact: z.number(),
  reasoning: z.string(),
});
type RawClassification = z.infer<typeof outputSchema>;

/** Returned whenever Claude is unreachable or answers nonsense, so callers never handle errors. */
export const FALLBACK_CLASSIFICATION: Classification = {
  category: "other",
  confidence: 0.3,
  severity: 3,
  safetyRisk: 3,
  communityImpact: 3,
  reasoning: "AI classification unavailable — defaulted for manual review.",
  usedFallback: true,
};

const SYSTEM_PROMPT = `You triage civic infrastructure complaints (city streets and campuses in Bhopal) for the responsible maintenance team.
Classify the complaint into exactly one category: ${CATEGORIES.join(", ")}.
- pothole: damaged roads, footpaths, speed breakers, cave-ins
- garbage: litter, overflowing bins, dumped waste
- water_leak: burst or leaking pipes, taps, tanks, waterlogging from supply lines
- streetlight: lights not working, flickering, or on during the day
- electrical: exposed wires, sparking poles, open junction boxes, transformer faults
- sanitation: open or missing manhole/drain covers, blocked drains, sewage overflow, dirty toilets
- other: only when none of the above fits
Rate each on 1–5:
- severity: how bad the physical problem is (1 cosmetic, 5 critical failure)
- safetyRisk: likelihood of injury or harm (1 none, 5 immediate danger e.g. exposed live wires, deep open pit)
- communityImpact: how many people are affected (1 one person, 5 a whole neighbourhood, hostel or main road)
confidence: 0–1, how sure you are of the category.
reasoning: one sentence under 25 words citing the concrete evidence from the text and/or photo.
If a photo is attached, trust what it shows over vague text.`;

const clampInt = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

/** Coerces model output into valid ranges: 1–5 integers, 0–1 confidence, trimmed one-line reasoning. */
export function normalizeClassification(raw: RawClassification): Classification {
  return {
    category: raw.category,
    confidence: Math.min(1, Math.max(0, raw.confidence)),
    severity: clampInt(raw.severity),
    safetyRisk: clampInt(raw.safetyRisk),
    communityImpact: clampInt(raw.communityImpact),
    reasoning: raw.reasoning.replace(/\s+/g, " ").trim().slice(0, 300),
    usedFallback: false,
  };
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 1 }));

/**
 * Classifies a complaint with Claude using structured JSON output; the photo (if any) is sent as a
 * vision block so the model can judge damage directly. 20 s timeout, 1 retry, and any failure
 * returns FALLBACK_CLASSIFICATION instead of throwing.
 */
export async function classifyComplaint(input: {
  title: string;
  description: string;
  photoUrl?: string | null;
}): Promise<Classification> {
  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: `Title: ${input.title}\nDescription: ${input.description}` },
  ];
  if (input.photoUrl) content.unshift({ type: "image", source: { type: "url", url: input.photoUrl } });

  try {
    const message = await getClient().messages.parse({
      model: CLASSIFIER_MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(outputSchema) },
    });
    return message.parsed_output ? normalizeClassification(message.parsed_output) : FALLBACK_CLASSIFICATION;
  } catch (err) {
    console.warn("[classify] falling back:", err instanceof Error ? err.message : err);
    return FALLBACK_CLASSIFICATION;
  }
}
