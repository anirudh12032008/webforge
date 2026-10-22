import { z } from "zod";
import { CATEGORIES, LOCALES, STATUSES } from "@/types";

const lngLat = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

const optionalText = (max: number) => z.string().trim().max(max).nullish();

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/**
 * Body of POST /api/complaints. A report needs a photo or a description (≥10 chars) — either is
 * enough; with a photo alone the AI writes the title and description from the image.
 */
export const createComplaintSchema = z
  .object({
  title: z.preprocess(blankToUndefined, z.string().trim().min(3).max(120).optional()),
  description: z.preprocess(blankToUndefined, z.string().trim().min(10).max(2000).optional()),
  // Our private-photo path (/api/photos/complaints/…) or any https image URL.
  photoUrl: z
    .string()
    .max(500)
    .refine((v) => v.startsWith("/api/photos/complaints/") || /^https:\/\//.test(v), "Invalid photo URL")
    .nullish(),
  locale: z.enum(LOCALES).default("en"),
  location: lngLat,
  /** Org the reporter chose; must cover the location. Omitted → most specific org that does. */
  orgSlug: z.string().trim().min(1).max(60).optional(),
  locationLabel: optionalText(200),
  reporterName: optionalText(80),
  reporterContact: optionalText(120),
  })
  .refine((c) => c.description || c.photoUrl, { message: "Add a photo or describe the problem", path: ["description"] });
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
/** What a client sends (locale optional, defaults to English). */
export type CreateComplaintBody = z.input<typeof createComplaintSchema>;

/**
 * Parses a "minLng,minLat,maxLng,maxLat" map viewport into numbers.
 * Rejects anything that isn't four finite numbers with min < max on both axes.
 */
const bbox = z.string().transform((value, ctx) => {
  const parts = value.split(",").map(Number);
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n)) || minLng >= maxLng || minLat >= maxLat) {
    ctx.addIssue({ code: "custom", message: "bbox must be minLng,minLat,maxLng,maxLat" });
    return z.NEVER;
  }
  return { minLng, minLat, maxLng, maxLat };
});

/** Query string of GET /api/complaints; numbers arrive as strings, hence coerce. */
export const listComplaintsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  org: z.string().trim().min(1).max(60).optional(),
  department: z.coerce.number().int().positive().optional(),
  bbox: bbox.optional(),
  sort: z.enum(["priority", "newest", "oldest"]).default("priority"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type ListComplaintsQuery = z.infer<typeof listComplaintsQuerySchema>;

/** Body of PATCH /api/complaints/[id]: admin overrides; at least one field required. */
export const patchComplaintSchema = z
  .object({
    status: z.enum(STATUSES),
    category: z.enum(CATEGORIES),
    departmentId: z.number().int().positive().nullable(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to update" });
export type PatchComplaintInput = z.infer<typeof patchComplaintSchema>;

/** ?org= filter shared by analytics, clusters and other org-scoped reads. */
export const orgQuerySchema = z.object({ org: z.string().trim().min(1).max(60).optional() });

/** Body of POST /api/complaints/bulk: one status applied to up to 100 complaints. */
export const bulkStatusSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
  status: z.enum(STATUSES),
});
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;

/** Body of POST /api/complaints/[id]/merge: the report this one duplicates. */
export const mergeSchema = z.object({ into: z.uuid() });
