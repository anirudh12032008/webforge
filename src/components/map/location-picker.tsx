"use client";

import { AdvancedMarker, APIProvider, Map, useMap, useMapsLibrary, type MapMouseEvent } from "@vis.gl/react-google-maps";
import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/shared/locale-provider";
import { Button } from "@/components/ui/button";
import { pick } from "@/lib/i18n";
import { REPORT } from "@/lib/i18n/messages/report";
import type { LngLat } from "@/types";

/** Default view: MANIT Bhopal, which sits inside the city so both orgs are one tap away. */
export const DEFAULT_CENTER = { lat: 23.2167, lng: 77.4075 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Props = {
  value: LngLat | null;
  onPick: (location: LngLat) => void;
  onAddress: (label: string | null) => void;
};

function currentPosition(): Promise<LngLat> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000 },
    ),
  );
}

function LocateButton({ onLocated }: { onLocated: (location: LngLat) => void }) {
  const t = pick(REPORT, useLocale());
  const [locating, setLocating] = useState(false);
  const locate = async () => {
    setLocating(true);
    try {
      onLocated(await currentPosition());
    } catch {
      toast.error(t.locationError);
    } finally {
      setLocating(false);
    }
  };
  return (
    <Button type="button" variant="outline" onClick={locate} disabled={locating}>
      <LocateFixed aria-hidden />
      {locating ? t.finding : t.useMyLocation}
    </Button>
  );
}

function PickerMap({ value, onPick, onAddress }: Props) {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");

  const pick = async (location: LngLat) => {
    onPick(location);
    onAddress(null);
    if (!geocoding) return;
    try {
      const { results } = await new geocoding.Geocoder().geocode({ location });
      onAddress(results[0]?.formatted_address ?? null);
    } catch {
      onAddress(null);
    }
  };

  const onMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) void pick(e.detail.latLng);
  };

  return (
    <div className="space-y-3">
      <div className="h-72 overflow-hidden rounded-lg border sm:h-96">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={onMapClick}
        >
          {value && <AdvancedMarker position={value} title="Reported location" />}
        </Map>
      </div>
      <LocateButton
        onLocated={(location) => {
          map?.panTo(location);
          map?.setZoom(17);
          void pick(location);
        }}
      />
    </div>
  );
}

/**
 * Click-to-pin Google Map with "use my location" and reverse-geocoded address. Without a Maps key
 * it degrades to GPS-only so reporting still works in local dev or if the key is misconfigured.
 */
export function LocationPicker(props: Props) {
  const t = pick(REPORT, useLocale());
  if (!MAPS_KEY) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p>{t.mapUnavailable}</p>
        <LocateButton onLocated={(location) => (props.onPick(location), props.onAddress(null))} />
        {props.value && (
          <p className="text-foreground">{t.pinnedAt(props.value.lat.toFixed(5), props.value.lng.toFixed(5))}</p>
        )}
      </div>
    );
  }
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <PickerMap {...props} />
    </APIProvider>
  );
}
