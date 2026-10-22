import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "@/env";
import { readPhoto } from "@/lib/photos";
import { CATEGORIES, type Classification, type Locale } from "@/types";

export const CLASSIFIER_MODEL = "claude-opus-5-5";
// Classification is a short, well-specified task: low effort keeps the user-facing wait short.
const EFFORT = "low";

const outputSchema = z.object({
  category: z.enum(CATEGORIES),
  confidence: z.number(),
  severity: z.number(),
  safetyRisk: z.number(),
  communityImpact: z.number(),
  reasoning: z.string(),
  suggestedTitle: z.string(),
  summary: z.string(),
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
  suggestedTitle: "Reported issue",
  summary: "",
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
suggestedTitle: a specific title under 60 characters, e.g. "Open manhole outside Hostel 7 gate".
summary: one or two plain sentences describing the problem as a maintenance worker would need it.
If a photo is attached, trust what it shows over vague text. If there is only a photo, describe what it shows.`;

const LANGUAGE_NAMES: Record<Locale, string> = { en: "English", hi: "Hindi (Devanagari script)" };

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
    suggestedTitle: raw.suggestedTitle.replace(/\s+/g, " ").trim().slice(0, 120) || "Reported issue",
    summary: raw.summary.trim().slice(0, 1000),
    usedFallback: false,
  };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_INLINE_BYTES = 5 * 1024 * 1024;

function inline(bytes: ArrayBuffer, type: string): Anthropic.ImageBlockParam["source"] | null {
  if (bytes.byteLength > MAX_INLINE_BYTES || !(IMAGE_TYPES as readonly string[]).includes(type)) return null;
  return { type: "base64", media_type: type as ImageType, data: Buffer.from(bytes).toString("base64") };
}

/**
 * Fetches the photo ourselves and inlines it as base64, so vision works even when a host blocks
 * Anthropic's fetcher (or a Blob store is private). Falls back to a URL source if the fetch fails.
 */
async function imageSource(url: string): Promise<Anthropic.ImageBlockParam["source"] | null> {
  const own = await readPhoto(url).catch(() => null);
  if (own) return inline(own.bytes, own.contentType);
  if (!url.startsWith("https://")) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "CivicLens/1.0 (civic issue triage)" } });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    const bytes = res.ok ? await res.arrayBuffer() : null;
    const source = bytes && inline(bytes, type);
    if (source) return source;
  } catch {
    // Network error or timeout: let Claude try the URL directly.
  }
  return { type: "url", url };
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 1 }));

/**
 * Classifies a complaint with Claude using structured JSON output; the photo (if any) is sent as a
 * vision block so the model can judge damage directly. 20 s timeout, 1 retry, and any failure
 * returns FALLBACK_CLASSIFICATION instead of throwing.
 */
export async function classifyComplaint(input: {
  title?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  locale?: Locale;
}): Promise<Classification> {
  const reported = [input.title && `Title: ${input.title}`, input.description && `Description: ${input.description}`].filter(Boolean);
  const language = LANGUAGE_NAMES[input.locale ?? "en"];
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `${reported.length ? reported.join("\n") : "No text was given; classify from the photo."}\n\nWrite reasoning, suggestedTitle and summary in ${language}.`,
    },
  ];
  const photo = input.photoUrl ? await imageSource(input.photoUrl) : null;
  if (photo) content.unshift({ type: "image", source: photo });

  try {
    // Server-side fallback: if a safety classifier declines, the API re-runs the request on a
    // fallback model inside the same call instead of returning a refusal.
    const message = await getClient().beta.messages.parse({
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      model: CLASSIFIER_MODEL,
      max_tokens: 2000,
      output_config: { effort: EFFORT, format: zodOutputFormat(outputSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
    return message.parsed_output ? normalizeClassification(message.parsed_output) : FALLBACK_CLASSIFICATION;
  } catch (err) {
    console.warn("[classify] falling back:", err instanceof Error ? err.message : err);
    return FALLBACK_CLASSIFICATION;
  }
}
