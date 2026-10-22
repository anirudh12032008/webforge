import { NextResponse } from "next/server";
import { getHotspots } from "@/lib/geo/clusters";
import { validationError } from "@/lib/http";
import { orgQuerySchema } from "@/lib/validation";

/** Recurring-problem hotspots from DBSCAN clustering (?org=). */
export async function GET(request: Request) {
  const parsed = orgQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error, "Invalid org");
  return NextResponse.json({ hotspots: await getHotspots(parsed.data.org) });
}
