"use client";

import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_CENTER } from "@/components/map/location-picker";
import { CATEGORY_LABELS, priorityBand } from "@/lib/labels";
import type { MapPoint } from "@/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Translucent circles sized and coloured by priority. Overlapping halos read as a heatmap
 * without Google's deprecated HeatmapLayer.
 */
function HeatHalos({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  useEffect(() => {
    if (!map || !maps) return;
    const circles = points.map(
      (p) =>
        new maps.Circle({
          map,
          center: p.location,
          radius: 30 + p.priorityScore * 1.5,
          fillColor: priorityBand(p.priorityScore).hex,
          fillOpacity: 0.22,
          strokeOpacity: 0,
          clickable: false,
        }),
    );
    return () => circles.forEach((c) => c.setMap(null));
  }, [map, maps, points]);
  return null;
}

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
  const [selected, setSelected] = useState<MapPoint | null>(null);

  if (!MAPS_KEY) {
    return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Map unavailable: the Google Maps key isn&apos;t configured.</p>;
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border sm:h-[28rem]">
      <APIProvider apiKey={MAPS_KEY}>
        <Map mapId="DEMO_MAP_ID" defaultCenter={DEFAULT_CENTER} defaultZoom={14} gestureHandling="greedy" disableDefaultUI zoomControl clickableIcons={false}>
          {heat && <HeatHalos points={points} />}
          <FitToPoints points={points} />
          {points.map((p) => {
            const band = priorityBand(p.priorityScore);
            const size = 14 + Math.round(p.priorityScore / 10);
            return (
              <AdvancedMarker key={p.id} position={p.location} title={p.title} onClick={() => setSelected(p)}>
                <span
                  className="block rounded-full border-2 border-white shadow-md"
                  style={{ width: size, height: size, backgroundColor: band.hex }}
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
      </div>
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
    </div>
  );
}
