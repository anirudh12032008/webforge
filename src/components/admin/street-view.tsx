"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/admin/console";
import { useLocale } from "@/components/shared/locale-provider";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import type { LngLat } from "@/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const COVERAGE_RADIUS_M = 75;

/**
 * Looks up the nearest Street View panorama within 75 m first (StreetViewService), and only mounts
 * a panorama when imagery exists, so admins see the real spot or a clear "no imagery" note.
 */
function Panorama({ location }: { location: LngLat }) {
  const lib = useMapsLibrary("streetView");
  const t = pick(ADMIN, useLocale());
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "none">("loading");

  useEffect(() => {
    if (!lib || !ref.current) return;
    const el = ref.current;
    new lib.StreetViewService()
      // Google street imagery only: skips user-uploaded indoor photospheres (e.g. shop interiors).
      .getPanorama({ location, radius: COVERAGE_RADIUS_M, sources: [lib.StreetViewSource.GOOGLE] })
      .then(({ data }) => {
        new lib.StreetViewPanorama(el, { pano: data.location?.pano, disableDefaultUI: true, zoomControl: true, addressControl: false });
        setState("ready");
      })
      .catch(() => setState("none"));
  }, [lib, location]);

  return (
    <div className="relative h-60 overflow-hidden rounded-lg border bg-muted sm:h-72">
      <div ref={ref} className="absolute inset-0" aria-label={t.streetViewAria} />
      {state !== "ready" && (
        <p className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
          {state === "loading" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <EyeOff className="size-5" aria-hidden />}
          {state === "loading" ? t.streetViewLoading : t.streetViewNone(COVERAGE_RADIUS_M)}
        </p>
      )}
    </div>
  );
}

/** Street View of a complaint's location for the admin detail page. */
export function StreetView({ location }: { location: LngLat }) {
  const t = pick(ADMIN, useLocale());
  if (!MAPS_KEY) return <EmptyState icon={EyeOff}>{t.streetViewUnavailable}</EmptyState>;
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Panorama location={location} />
    </APIProvider>
  );
}
