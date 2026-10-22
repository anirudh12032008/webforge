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
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
          <img src={preview} alt={t.photoAlt} className="max-h-48 rounded-lg border object-cover" />
          <Button type="button" size="icon-sm" variant="secondary" className="absolute top-2 right-2" onClick={onRemove} aria-label={t.removePhoto}>
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted">
          <Camera className="size-4" aria-hidden />
          {t.takePhoto}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onSelect(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
