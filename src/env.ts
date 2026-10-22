import { z } from "zod";

/**
 * Validates every environment variable once, at first import.
 * Fails fast with a readable list of bad keys instead of letting
 * `undefined` leak into a database or AI call later.
 */
const schema = z.object({
  DATABASE_URL: z.url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  VOYAGE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
});

// `next build` imports route modules to collect config, before any request runs. Placeholders let
// the build succeed without secrets; at runtime a missing variable still fails fast.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const BUILD_PLACEHOLDERS: z.infer<typeof schema> = {
  DATABASE_URL: "postgresql://build:build@localhost/build",
  ANTHROPIC_API_KEY: "build",
  VOYAGE_API_KEY: "build",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "build",
  BLOB_READ_WRITE_TOKEN: "build",
};

if (!parsed.success && !isBuild) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

export const env = parsed.success ? parsed.data : BUILD_PLACEHOLDERS;
