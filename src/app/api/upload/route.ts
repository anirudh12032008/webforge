import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { errorResponse } from "@/lib/http";
import { PHOTO_PREFIX, toPhotoUrl } from "@/lib/photos";

// Vercel caps function bodies at 4.5 MB; the client compresses to well under this.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Stores one complaint photo in the private Blob store and returns our own URL for it. */
export async function POST(request: Request) {
  if (!env.BLOB_READ_WRITE_TOKEN) return errorResponse("Photo uploads aren't set up yet.", 503);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return errorResponse("Attach a photo in the 'file' field.", 400);
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse("Photo must be a JPEG, PNG or WebP image.", 415);
  if (file.size > MAX_BYTES) return errorResponse("Photo must be under 4 MB.", 413);

  try {
    const blob = await put(`${PHOTO_PREFIX}${file.name || "photo.jpg"}`, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: toPhotoUrl(blob.pathname) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return errorResponse("Couldn't upload the photo. You can submit without it.", 502);
  }
}
