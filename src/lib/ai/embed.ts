import { z } from "zod";
import { env } from "@/env";

export const EMBEDDING_MODEL = "voyage-3-lite";
export const EMBEDDING_DIMS = 512;

const responseSchema = z.object({
  data: z.array(z.object({ embedding: z.array(z.number()) })).min(1),
});

/**
 * Embeds text with Voyage voyage-3-lite (512 dims) for pgvector cosine search.
 * Returns null on any failure (network, non-2xx, wrong shape or dimension) and logs it,
 * so the pipeline simply skips dedup rather than failing the complaint.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const request = () =>
    fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: [text], model: EMBEDDING_MODEL, input_type: "document" }),
      signal: AbortSignal.timeout(10_000),
    });
  try {
    let res = await request();
    if (res.status === 429) {
      // Rate limited (free tier is 3 req/min): honour Retry-After up to 5 s, then try once more.
      const waitS = Math.min(5, Number(res.headers.get("retry-after")) || 2);
      await new Promise((r) => setTimeout(r, waitS * 1000));
      res = await request();
    }
    if (!res.ok) throw new Error(`Voyage ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const embedding = responseSchema.parse(await res.json()).data[0].embedding;
    if (embedding.length !== EMBEDDING_DIMS) throw new Error(`expected ${EMBEDDING_DIMS} dims, got ${embedding.length}`);
    return embedding;
  } catch (err) {
    console.warn("[embed] skipped, dedup disabled for this complaint:", err instanceof Error ? err.message : err);
    return null;
  }
}
