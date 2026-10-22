import { NextResponse } from "next/server";
import { z } from "zod";
import { getReporterViews } from "@/db/my-reports";
import { validationError } from "@/lib/http";

// POST so up to 50 ids don't end up in URLs or access logs.
const bodySchema = z.object({ ids: z.array(z.uuid()).max(50) });

/** Status and history of the reports this device submitted (ids from localStorage). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error, "Send up to 50 report ids");
  return NextResponse.json({ reports: await getReporterViews(parsed.data.ids) });
}
