"use client";

import { Loader2 } from "lucide-react";
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
        <Button variant="outline" onClick={reset}>{t.another}</Button>
      </div>
    );
  }

  const busy = phase !== "idle";
  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[3fr_2fr]" noValidate>
      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-3 font-medium">{t.whereLegend}</legend>
        <LocationPicker value={location} onPick={onPick} onAddress={setAddress} />
        {location && <p className="text-sm text-muted-foreground">{address ?? t.lookingUpAddress}</p>}
        <FieldError messages={errors.location} />
        <OrgChoice orgs={orgs} value={orgSlug} onChange={setOrgSlug} t={t} />
      </fieldset>

      <fieldset className="min-w-0 space-y-4" disabled={busy}>
        <legend className="mb-3 font-medium">{t.whatLegend}</legend>
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
          <Input id="title" name="title" maxLength={120} placeholder={t.titlePlaceholder} />
          <FieldError messages={errors.title} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">{t.nameLabel}</label>
            <Input id="name" name="name" maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contact" className="text-sm font-medium">{t.contactLabel}</label>
            <Input id="contact" name="contact" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={busy || !location || !hasContent}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {phase === "uploading" ? t.uploading : phase === "analysing" ? t.analysing : t.submit}
        </Button>
        {!location && <p className="text-center text-sm text-muted-foreground">{t.pinToSubmit}</p>}
      </fieldset>
    </form>
  );
}
