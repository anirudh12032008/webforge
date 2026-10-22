import { NextResponse } from "next/server";
import { z } from "zod";
import { explainPriority } from "@/lib/ai/explain";
import { errorResponse } from "@/lib/http";
import { isLocale } from "@/lib/i18n";

export const maxDuration = 60;

/** "Why is this #N?" explanation + resource suggestion for one complaint (?lang=en|hi). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return errorResponse("Unknown complaint", 404);
  const lang = new URL(request.url).searchParams.get("lang");
  const result = await explainPriority(id.data, isLocale(lang) ? lang : "en");
  return result ? NextResponse.json(result) : errorResponse("The explanation isn't available right now. Try again in a moment.", 503);
}
