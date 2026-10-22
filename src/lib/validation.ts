import { z } from "zod";
import { CATEGORIES, STATUSES } from "@/types";

const lngLat = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

const optionalText = (max: number) => z.string().trim().max(max).nullish();

/** Body of POST /api/complaints. */
export const createComplaintSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  photoUrl: z.url().nullish(),
  location: lngLat,
  locationLabel: optionalText(200),
  reporterName: optionalText(80),
  reporterContact: optionalText(120),
});
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

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
