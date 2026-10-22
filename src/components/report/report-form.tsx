"use client";

import { Check, Loader2, MapPin } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LocationPicker } from "@/components/map/location-picker";
import { AnalysisCard } from "@/components/report/analysis-card";
import { OrgChoice } from "@/components/report/org-choice";
import { PhotoField } from "@/components/report/photo-field";
import { VoiceInputButton } from "@/components/report/voice-input-button";
import { useLocale } from "@/components/shared/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type SubmitResponse } from "@/lib/api";
import { pick, SPEECH_LANG } from "@/lib/i18n";
import { REPORT } from "@/lib/i18n/messages/report";
import { compressImage } from "@/lib/image";
import { getRememberedContact, rememberReport } from "@/lib/my-reports";
import type { LngLat, Org } from "@/types";

type Photo = { blob: Blob; preview: string };
type Phase = "idle" | "uploading" | "analysing";

/** Same rule as the server schema: a photo, or at least this many characters of description. */
const MIN_DESCRIPTION = 10;

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-sm text-destructive">{messages[0]}</p> : null;
}

/** Placeholder in the shape of the result card while the photo uploads and the AI reviews the report. */
function SubmittingCard({ phase, hasPhoto, t }: { phase: Exclude<Phase, "idle">; hasPhoto: boolean; t: { uploading: string; analysing: string } }) {
  const steps = [...(hasPhoto ? [{ key: "uploading", label: t.uploading }] : []), { key: "analysing", label: t.analysing }];
  const current = steps.findIndex((s) => s.key === phase);
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border bg-card animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none" aria-busy>
      <div className="hazard-band h-2" aria-hidden />
      <div className="space-y-6 p-5 sm:p-6">
        <ol className="space-y-2" aria-live="polite">
          {steps.map((step, i) => (
            <li key={step.key} className={`flex items-center gap-2 text-sm ${i <= current ? "font-medium" : "text-muted-foreground"}`}>
              {i < current ? <Check className="size-4 text-primary" aria-hidden /> : i === current ? <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> : <span className="size-4" aria-hidden />}
              {step.label}
            </li>
          ))}
        </ol>
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-10 w-14 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Citizen report form: pin, org choice, photo and/or description (typed or spoken) → AI pipeline → result card. */
export function ReportForm() {
  const locale = useLocale();
  const t = pick(REPORT, locale);
  const [location, setLocation] = useState<LngLat | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [orgSlug, setOrgSlug] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [description, setDescription] = useState("");
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
      toast.error(t.photoReadError);
    }
  };

  const appendSpeech = (spoken: string) => setDescription((d) => (d.trim() ? `${d.trimEnd()} ${spoken}` : spoken));
  const hasContent = photo !== null || description.trim().length >= MIN_DESCRIPTION;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) return void toast.error(t.pinFirst);
    if (!hasContent) return void toast.error(t.needPhotoOrText);
    const data = new FormData(event.currentTarget);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      let photoUrl: string | null = null;
      if (photo) {
        setPhase("uploading");
        photoUrl = await api.uploadPhoto(photo.blob, "photo.jpg").catch((err: Error) => {
          toast.warning(t.uploadFailed(err.message));
          return null;
        });
      }
      setPhase("analysing");
      const reporterContact = text(data, "contact") || null;
      const response = await api.submitComplaint({
        title: text(data, "title") || undefined,
        description: description.trim() || undefined,
        photoUrl,
        location,
        locationLabel: address,
        orgSlug: orgSlug || undefined,
        reporterName: text(data, "name") || null,
        reporterContact,
        locale,
      });
      rememberReport(response.complaint.id, reporterContact);
      setResult(response);
      toast.success(t.submitted);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : t.submitError);
    } finally {
      setPhase("idle");
    }
  }

  if (result) {
    const reset = () => (setResult(null), setPhoto(null), setDescription(""), setLocation(null), setOrgs(null));
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <AnalysisCard complaint={result.complaint} analysis={result.analysis} />
        <Button variant="outline" size="lg" className="h-11 w-full px-5 sm:w-auto" onClick={reset}>{t.another}</Button>
      </div>
    );
  }

  const busy = phase !== "idle";
  return (
    <>
      {busy && <SubmittingCard phase={phase} hasPhoto={photo !== null} t={t} />}
      {/* Hidden, not unmounted, while submitting so typed fields survive a failed submit. */}
      <form onSubmit={handleSubmit} className={busy ? "hidden" : "grid gap-8 lg:grid-cols-[3fr_2fr]"} noValidate>
        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 font-heading text-lg font-semibold">
            <span className="mr-2 inline-flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-signal" aria-hidden>1</span>
            {t.whereLegend}
          </legend>
          <LocationPicker value={location} onPick={onPick} onAddress={setAddress} />
          {location && (
            <p className="flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-safety" aria-hidden />
              {address ?? t.lookingUpAddress}
            </p>
          )}
          <FieldError messages={errors.location} />
          <OrgChoice orgs={orgs} value={orgSlug} onChange={setOrgSlug} t={t} />
        </fieldset>

        <fieldset className="min-w-0 space-y-4" disabled={busy}>
          <legend className="mb-3 font-heading text-lg font-semibold">
            <span className="mr-2 inline-flex size-7 items-center justify-center rounded-full bg-foreground text-sm text-signal" aria-hidden>2</span>
            {t.whatLegend}
          </legend>
          <PhotoField preview={photo?.preview ?? null} onSelect={(f) => void onPhoto(f)} onRemove={() => setPhoto(null)} t={t} />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="description" className="text-sm font-medium">{t.detailsLabel}</label>
              <VoiceInputButton
                lang={SPEECH_LANG[locale]}
                onFinal={appendSpeech}
                labels={{ start: t.voiceStart, stop: t.voiceStop, denied: t.voiceDenied, error: t.voiceError }}
              />
            </div>
            <Textarea
              id="description"
              name="description"
              maxLength={2000}
              rows={4}
              className="min-h-28"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.detailsPlaceholder}
              aria-describedby="content-hint"
            />
            <FieldError messages={errors.description} />
            {!hasContent && <p id="content-hint" className="text-sm text-muted-foreground">{t.needPhotoOrText}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">{t.titleLabel}</label>
            <Input id="title" name="title" maxLength={120} placeholder={t.titlePlaceholder} className="h-11" />
            <FieldError messages={errors.title} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">{t.nameLabel}</label>
              <Input id="name" name="name" maxLength={80} autoComplete="name" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact" className="text-sm font-medium">{t.contactLabel}</label>
              <Input id="contact" name="contact" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} className="h-11" />
            </div>
          </div>

          {/* Pinned to the bottom of the screen on phones so submit is reachable from any field. */}
          <div className="sticky bottom-0 z-10 -mx-4 space-y-2 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy || !location || !hasContent}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {phase === "uploading" ? t.uploading : phase === "analysing" ? t.analysing : t.submit}
            </Button>
            {!location && <p className="text-center text-sm text-muted-foreground">{t.pinToSubmit}</p>}
          </div>
        </fieldset>
      </form>
    </>
  );
}
