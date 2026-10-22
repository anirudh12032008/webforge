import { NextResponse } from "next/server";
import { z } from "zod";

/** 400 response listing which fields failed validation, in a shape forms can show inline. */
export function validationError(error: z.ZodError, message = "Some fields need fixing") {
  return NextResponse.json({ error: message, fields: z.flattenError(error).fieldErrors }, { status: 400 });
}

/** JSON error response with a human-readable message. */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
