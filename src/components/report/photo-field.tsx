"use client";

import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  preview: string | null;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
  t: { photoLabel: string; takePhoto: string; photoAlt: string; removePhoto: string };
};

/** Camera/gallery picker with a removable preview of the compressed photo. */
export function PhotoField({ preview, onSelect, onRemove, t }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{t.photoLabel}</p>
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted animate-in fade-in zoom-in-95 motion-reduce:animate-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
          <img src={preview} alt={t.photoAlt} className="mx-auto max-h-64 w-full object-contain sm:max-h-56" />
          <Button type="button" size="icon-lg" variant="secondary" className="absolute top-2 right-2 size-11 rounded-full shadow-md" onClick={onRemove} aria-label={t.removePhoto}>
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-card p-4 text-center text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground has-focus-visible:border-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
          <Camera className="size-5 shrink-0" aria-hidden />
          {t.takePhoto}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onSelect(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
