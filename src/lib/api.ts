import type { CreateComplaintInput } from "@/lib/validation";
import type { Analysis, Complaint, LngLat, Org } from "@/types";

/** A failed API call, carrying the server's message and any per-field validation errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type ErrorBody = { error?: string; fields?: Record<string, string[]> };

/** fetch wrapper: parses JSON and turns non-2xx responses into ApiError with the server's message. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, fields } = body as ErrorBody;
    throw new ApiError(error ?? `Request failed (${res.status})`, res.status, fields);
  }
  return body as T;
}

export type SubmitResponse = { complaint: Complaint; analysis: Analysis };

/** Typed client for the CampusSense API, safe to use from client components. */
export const api = {
  eligibleOrgs: (location: LngLat) =>
    request<{ orgs: Org[] }>(`/api/orgs?lat=${location.lat}&lng=${location.lng}`).then((r) => r.orgs),

  uploadPhoto: (photo: Blob, filename: string) => {
    const form = new FormData();
    form.append("file", photo, filename);
    return request<{ url: string }>("/api/upload", { method: "POST", body: form }).then((r) => r.url);
  },

  submitComplaint: (input: CreateComplaintInput) =>
    request<SubmitResponse>("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
};
