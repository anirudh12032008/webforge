import { NextResponse } from "next/server";
import { z } from "zod";
import { findEligibleOrgs } from "@/db/queries";
import { validationError } from "@/lib/http";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/** Orgs that can handle a complaint at ?lat&lng, most specific first (campus before city). */
export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error, "lat and lng are required");
  return NextResponse.json({ orgs: await findEligibleOrgs(parsed.data) });
}
