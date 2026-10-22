import { get } from "@vercel/blob";
import { env } from "@/env";

/** Complaint photos live in a private Blob store and are served only through this route. */
export const PHOTO_ROUTE = "/api/photos/";
export const PHOTO_PREFIX = "complaints/";

export const toPhotoUrl = (pathname: string) => `${PHOTO_ROUTE}${pathname}`;

/** True for our own photo URLs, e.g. "/api/photos/complaints/abc.jpg" (no traversal, our prefix only). */
export function isOwnPhotoUrl(url: string): boolean {
  return url.startsWith(PHOTO_ROUTE + PHOTO_PREFIX) && !url.includes("..");
}

/**
 * Reads a private complaint photo straight from Blob storage using the server token, returning its
 * bytes and content type. Returns null for foreign URLs, a missing token, or a missing blob.
 */
export async function readPhoto(url: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  if (!isOwnPhotoUrl(url) || !env.BLOB_READ_WRITE_TOKEN) return null;
  const result = await get(url.slice(PHOTO_ROUTE.length), { access: "private", token: env.BLOB_READ_WRITE_TOKEN });
  if (!result || result.statusCode !== 200) return null;
  return { bytes: await new Response(result.stream).arrayBuffer(), contentType: result.blob.contentType };
}
