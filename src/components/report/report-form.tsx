"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LocationPicker } from "@/components/map/location-picker";
import { AnalysisCard } from "@/components/report/analysis-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type SubmitResponse } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { getRememberedContact, rememberReport } from "@/lib/my-reports";
import type { LngLat, Org } from "@/types";

type Photo = { blob: Blob; preview: string };
type Phase = "idle" | "uploading" | "analysing";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-sm text-destructive">{messages[0]}</p> : null;
}

/** Citizen report form: pin, org choice, details, photo → AI pipeline → result card. */
export function ReportForm() {
  const [location, setLocation] = useState<LngLat | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [contact, setContact] = useState("");

  useEffect(() => setContact(getRememberedContact()), []);
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  const onPick = (picked: LngLat) => {
    setLocation(picked);
    setOrgs(null);
    api
      .eligibleOrgs(picked)
      .then((found) => {
        setOrgs(found);
        setOrgSlug(found[0]?.slug ?? "");
      })
      .catch(() => setOrgs([]));
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await compressImage(file);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
    } catch {
      toast.error("Couldn't read that photo. Try a JPEG or PNG.");
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) return void toast.error("Pin where the problem is on the map first.");
    const data = new FormData(event.currentTarget);
    setErrors({});
    try {
      let photoUrl: string | null = null;
      if (photo) {
        setPhase("uploading");
        photoUrl = await api.uploadPhoto(photo.blob, "photo.jpg").catch((err: Error) => {
          toast.warning(`${err.message} Sending your report without the photo.`);
          return null;
        });
      }
      setPhase("analysing");
      const reporterContact = text(data, "contact") || null;
      const response = await api.submitComplaint({
        title: text(data, "title"),
        description: text(data, "description"),
        photoUrl,
        location,
        locationLabel: address,
        orgSlug: orgSlug || undefined,
        reporterName: text(data, "name") || null,
        reporterContact,
      });
      rememberReport(response.complaint.id, reporterContact);
      setResult(response);
      toast.success("Report submitted");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Couldn't submit the report.");
    } finally {
      setPhase("idle");
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <AnalysisCard complaint={result.complaint} analysis={result.analysis} />
        <Button variant="outline" onClick={() => (setResult(null), setPhoto(null), setLocation(null), setOrgs(null))}>
          Report another issue
        </Button>
      </div>
    );
  }

  const busy = phase !== "idle";
  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[3fr_2fr]" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-medium">Where is it?</legend>
        <LocationPicker value={location} onPick={onPick} onAddress={setAddress} />
        {location && <p className="text-sm text-muted-foreground">{address ?? "Pinned. Looking up the address…"}</p>}
        <FieldError messages={errors.location} />

        {orgs && orgs.length > 1 && (
          <div className="space-y-2 pt-2">
            <p className="font-medium">Who should fix it?</p>
            {orgs.map((org) => (
              <label key={org.slug} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-accent">
                <input type="radio" name="org" value={org.slug} checked={orgSlug === org.slug} onChange={() => setOrgSlug(org.slug)} className="accent-primary" />
                <span>
                  {org.name}
                  <span className="block text-sm text-muted-foreground">
                    {org.kind === "campus" ? "Handled by the campus maintenance office" : "Handled by the municipal corporation"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        {orgs?.length === 1 && <p className="text-sm">This goes to {orgs[0].name}.</p>}
        {orgs?.length === 0 && <p className="text-sm text-destructive">We can&apos;t take reports for this location yet.</p>}
      </fieldset>

      <fieldset className="space-y-4" disabled={busy}>
        <legend className="mb-3 font-medium">What&apos;s wrong?</legend>
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">Short title</label>
          <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="Open manhole near Hostel 7 gate" />
          <FieldError messages={errors.title} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">Details</label>
          <Textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="What you saw, how big it is, since when, anyone hurt?" />
          <FieldError messages={errors.description} />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Photo (optional, helps the AI judge severity)</p>
          {photo ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
              <img src={photo.preview} alt="Selected photo" className="max-h-48 rounded-lg border object-cover" />
              <Button type="button" size="icon-sm" variant="secondary" className="absolute top-2 right-2" onClick={() => setPhoto(null)} aria-label="Remove photo">
                <X />
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted">
              <Camera className="size-4" aria-hidden />
              Take or choose a photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Your name (optional)</label>
            <Input id="name" name="name" maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contact" className="text-sm font-medium">Phone or email (optional)</label>
            <Input id="contact" name="contact" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={busy || !location}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {phase === "uploading" ? "Uploading photo…" : phase === "analysing" ? "AI is reviewing your report…" : "Submit report"}
        </Button>
        {!location && <p className="text-center text-sm text-muted-foreground">Pin the location on the map to submit.</p>}
      </fieldset>
    </form>
  );
}
