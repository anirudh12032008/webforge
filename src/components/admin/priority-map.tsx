"use client";

import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HeatmapOverlay } from "@/components/map/heatmap-overlay";
import { HotspotBubbles, useHotspots } from "@/components/map/hotspot-bubbles";
import { DEFAULT_CENTER } from "@/components/map/location-picker";
import { CATEGORY_LABELS, priorityBand } from "@/lib/labels";
import type { MapPoint } from "@/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Zooms the map to fit every marker once points are known. */
function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length < 2) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p.location));
    map.fitBounds(bounds, 48);
  }, [map, points]);
  return null;
}

/** Admin map: one marker per open complaint, coloured by priority band, with an optional heat view. */
export function PriorityMap({ points }: { points: MapPoint[] }) {
  const [heat, setHeat] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const hotspots = useHotspots(useSearchParams().get("org"), showHotspots);

  if (!MAPS_KEY) {
    return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Map unavailable: the Google Maps key isn&apos;t configured.</p>;
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border sm:h-[28rem]">
      <APIProvider apiKey={MAPS_KEY}>
        <Map mapId="DEMO_MAP_ID" defaultCenter={DEFAULT_CENTER} defaultZoom={14} gestureHandling="greedy" disableDefaultUI zoomControl clickableIcons={false}>
          {heat && <HeatmapOverlay points={points} />}
          {showHotspots && hotspots && <HotspotBubbles hotspots={hotspots} />}
          <FitToPoints points={points} />
          {points.map((p) => {
            const band = priorityBand(p.priorityScore);
            const size = 14 + Math.round(p.priorityScore / 10);
            return (
              <AdvancedMarker key={p.id} position={p.location} title={p.title} onClick={() => setSelected(p)}>
                <span
                  className="block rounded-full border-2 border-white shadow-md transition-opacity"
                  style={{ width: size, height: size, backgroundColor: band.hex, opacity: heat ? 0.35 : 1 }}
                />
              </AdvancedMarker>
            );
          })}
          {selected && (
            <InfoWindow position={selected.location} onCloseClick={() => setSelected(null)} headerDisabled>
              <div className="max-w-56 space-y-1 p-1 text-sm text-foreground">
                <p className="font-medium">{selected.title}</p>
                <p className="text-muted-foreground">
                  {CATEGORY_LABELS[selected.category]}, priority {selected.priorityScore}
                </p>
                <Link href={`/complaints/${selected.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  Open complaint
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      <div className="absolute top-3 left-3 flex gap-2">
        <button
          type="button"
          onClick={() => setHeat((h) => !h)}
          aria-pressed={heat}
          className="rounded-md border bg-background/95 px-3 py-1.5 text-sm font-medium shadow-sm aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {heat ? "Hide heat" : "Show heat"}
        </button>
        <button
          type="button"
          onClick={() => setShowHotspots((h) => !h)}
          aria-pressed={showHotspots}
          className="rounded-md border bg-background/95 px-3 py-1.5 text-sm font-medium shadow-sm aria-pressed:bg-foreground aria-pressed:text-background"
        >
          Hotspots
        </button>
        {showHotspots && hotspots?.length === 0 && (
          <span className="self-center rounded-full bg-background/95 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">No hotspots yet</span>
        )}
      </div>
      {heat ? (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-background/95 px-3 py-1.5 text-xs shadow-sm">
          Low
          <span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, rgba(31,111,184,0.15), #1f6fb8, #f2c230, #c8372d)" }} aria-hidden />
          High concentration
        </div>
      ) : (
        <ul className="absolute bottom-3 left-3 flex gap-3 rounded-md bg-background/95 px-3 py-1.5 text-xs shadow-sm">
          {[80, 50, 10].map((score) => {
            const band = priorityBand(score);
            return (
              <li key={band.label} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: band.hex }} aria-hidden />
                {band.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
