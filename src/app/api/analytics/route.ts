import { NextResponse } from "next/server";
import { getAnalytics } from "@/db/analytics";
import { validationError } from "@/lib/http";
import { orgQuerySchema } from "@/lib/validation";

/** Open/resolved counts, resolution times, 30-day trend and per-category/team breakdowns (?org=). */
export async function GET(request: Request) {
  const parsed = orgQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error, "Invalid org");
  return NextResponse.json(await getAnalytics(parsed.data.org));
}
