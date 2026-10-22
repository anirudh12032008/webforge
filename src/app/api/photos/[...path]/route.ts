import { errorResponse } from "@/lib/http";
import { PHOTO_ROUTE, readPhoto } from "@/lib/photos";

/** Streams a private complaint photo; only paths under complaints/ are served. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const photo = await readPhoto(PHOTO_ROUTE + (await params).path.join("/"));
  if (!photo) return errorResponse("Photo not found", 404);
  return new Response(photo.bytes, {
    headers: { "Content-Type": photo.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
