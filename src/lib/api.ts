import type { BulkStatusInput, CreateComplaintBody, PatchComplaintInput } from "@/lib/validation";
import type { Analysis, Complaint, LngLat, Org, ReporterView } from "@/types";

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

  updateComplaint: (id: string, patch: PatchComplaintInput, actor = "admin") =>
    request<{ complaint: Complaint }>(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-actor": actor },
      body: JSON.stringify(patch),
    }).then((r) => r.complaint),

  bulkStatus: (input: BulkStatusInput, actor = "admin") =>
    request<{ updated: number }>("/api/complaints/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor": actor },
      body: JSON.stringify(input),
    }).then((r) => r.updated),

  mergeComplaint: (id: string, into: string, actor = "admin") =>
    request<{ complaint: Complaint }>(`/api/complaints/${id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor": actor },
      body: JSON.stringify({ into }),
    }),

  unmergeComplaint: (id: string, actor = "admin") =>
    request<{ complaint: Complaint }>(`/api/complaints/${id}/merge`, { method: "DELETE", headers: { "x-actor": actor } }),

  myReports: (ids: string[]) =>
    request<{ reports: ReporterView[] }>("/api/my-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => r.reports),

  submitComplaint: (input: CreateComplaintBody) =>
    request<SubmitResponse>("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
};
