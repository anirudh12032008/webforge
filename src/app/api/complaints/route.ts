import { NextResponse } from "next/server";
import { listComplaints } from "@/db/dashboard";
import { OrgNotEligibleError, submitComplaint } from "@/lib/ai/pipeline";
import { errorResponse, validationError } from "@/lib/http";
import { createComplaintSchema, listComplaintsQuerySchema } from "@/lib/validation";

// Claude (20 s, 1 retry) + Voyage + DB round-trips; leave headroom.
export const maxDuration = 60;

/** Submits a complaint and runs the full AI pipeline; responds with the stored complaint + analysis. */
export async function POST(request: Request) {
  const parsed = createComplaintSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  try {
    return NextResponse.json(await submitComplaint(parsed.data), { status: 201 });
  } catch (err) {
    if (err instanceof OrgNotEligibleError) return errorResponse(err.message, 422);
    console.error("[POST /api/complaints]", err);
    return errorResponse("Couldn't save the report. Please try again.", 500);
  }
}

/** Lists original complaints with ?status&category&org&department&bbox&sort&page&pageSize. */
export async function GET(request: Request) {
  const parsed = listComplaintsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error, "Invalid filters");
  return NextResponse.json(await listComplaints(parsed.data));
}
