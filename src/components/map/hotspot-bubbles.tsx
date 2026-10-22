"use client";

import { AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { waiting } from "@/components/admin/console";
import { useLocale } from "@/components/shared/locale-provider";
import type { Hotspot } from "@/lib/geo/clusters";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { categoryLabels } from "@/lib/i18n/messages/labels";

/** Same radius DBSCAN clusters with (CLUSTER_EPS_M), so the bubble shows the area that was grouped. */
const BUBBLE_RADIUS_M = 60;

/**
 * Loads hotspots for the org in the URL from GET /api/clusters. Only fetches while `enabled`,
 * so the dashboard pays nothing until the toggle is turned on; null means "still loading".
 */
export function useHotspots(org: string | null, enabled: boolean): Hotspot[] | null {
  const [hotspots, setHotspots] = useState<Hotspot[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setHotspots(null);
    fetch(`/api/clusters${org ? `?org=${encodeURIComponent(org)}` : ""}`, { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ hotspots: Hotspot[] }>) : { hotspots: [] }))
      .then((body) => setHotspots(body.hotspots))
      .catch(() => controller.signal.aborted || setHotspots([]));
    return () => controller.abort();
  }, [org, enabled]);
  return hotspots;
}

/** One translucent google.maps.Circle per hotspot; red stroke when recurring. */
function HotspotCircles({ hotspots, onSelect }: { hotspots: Hotspot[]; onSelect: (h: Hotspot) => void }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  useEffect(() => {
    if (!map || !maps) return;
    const circles = hotspots.map((h) => {
      const color = h.recurring ? "#c8372d" : "#1c5d8c";
      const circle = new maps.Circle({
        map,
        center: h.center,
        radius: BUBBLE_RADIUS_M,
        fillColor: color,
        fillOpacity: 0.18,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      circle.addListener("click", () => onSelect(h));
      return circle;
    });
    return () => circles.forEach((c) => c.setMap(null));
  }, [map, maps, hotspots, onSelect]);
  return null;
}

/** Hotspot bubbles: circle + count pill (with a Recurring badge) and an info window on click. */
export function HotspotBubbles({ hotspots }: { hotspots: Hotspot[] }) {
  const locale = useLocale();
  const t = pick(ADMIN, locale);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  return (
    <>
      <HotspotCircles hotspots={hotspots} onSelect={setSelected} />
      {hotspots.map((h) => (
        <AdvancedMarker key={h.clusterId} position={h.center} title={h.label ?? t.hotspot} onClick={() => setSelected(h)} zIndex={1000}>
          <span className="flex items-center gap-1 rounded-full border border-white bg-foreground px-2 py-0.5 text-xs font-semibold text-background shadow-md">
            {h.reports}
            {h.recurring && (
              <span className="flex items-center gap-0.5 rounded-full bg-safety px-1.5 text-[10px] text-white">
                <Repeat className="size-2.5" aria-hidden /> {t.recurring}
              </span>
            )}
          </span>
        </AdvancedMarker>
      ))}
      {selected && (
        <InfoWindow position={selected.center} onCloseClick={() => setSelected(null)} headerDisabled>
          <div className="max-w-60 space-y-1 p-1 text-sm text-foreground">
            <p className="font-medium">{selected.label ?? t.unnamedLocation}</p>
            <p className="text-muted-foreground">{selected.categories.map((c) => categoryLabels(locale)[c]).join(", ")}</p>
            <p>
              {t.recentReports(selected.recentReports)}
              {selected.recurring && <span className="font-medium text-safety">{t.recurringSuffix}</span>}
            </p>
            <p className="text-muted-foreground">{t.lastReport(waiting(selected.lastReportedAt, locale))}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
