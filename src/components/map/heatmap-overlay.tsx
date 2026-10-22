"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { LngLat } from "@/types";

type HeatPoint = { location: LngLat; priorityScore: number };

/** Transparent → blue → yellow → red, sampled into a 256-entry RGBA lookup. */
function buildGradient(): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(1024);
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(31,111,184,0)");
  g.addColorStop(0.25, "#1f6fb8");
  g.addColorStop(0.6, "#f2c230");
  g.addColorStop(1, "#c8372d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

/**
 * Canvas density heatmap as a Google Maps OverlayView (simpleheat-style): every point stamps a
 * blurred radial alpha blob weighted by priority onto a grayscale canvas, then each pixel's
 * accumulated alpha is mapped through a colour gradient. Redrawn on every pan/zoom via draw().
 */
export function HeatmapOverlay({ points, opacity = 0.75 }: { points: HeatPoint[]; opacity?: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const gradient = buildGradient();
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = String(opacity);

    class Heat extends google.maps.OverlayView {
      onAdd() {
        this.getPanes()?.overlayLayer.appendChild(canvas);
      }
      onRemove() {
        canvas.remove();
      }
      draw() {
        const projection = this.getProjection();
        const bounds = map?.getBounds();
        if (!projection || !bounds) return;
        const ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
        const sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
        if (!ne || !sw) return;

        // Cover exactly the visible map rect so the canvas stays aligned while panning.
        const width = Math.ceil(ne.x - sw.x);
        const height = Math.ceil(sw.y - ne.y);
        // Before layout (or when bounds wrap the globe) the rect is empty or huge; getImageData would throw.
        if (width <= 0 || height <= 0 || width * height > 8_000_000) {
          canvas.width = canvas.height = 1;
          return;
        }
        const dpr = window.devicePixelRatio || 1;
        canvas.style.left = `${sw.x}px`;
        canvas.style.top = `${ne.y}px`;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Radius grows with zoom so a hotspot keeps roughly the same ground footprint.
        const zoom = map?.getZoom() ?? 14;
        const radius = Math.min(90, Math.max(26, 40 * 2 ** ((zoom - 14) / 2)));
        for (const p of points) {
          const px = projection.fromLatLngToDivPixel(new google.maps.LatLng(p.location));
          if (!px) continue;
          const x = px.x - sw.x;
          const y = px.y - ne.y;
          const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
          blob.addColorStop(0, `rgba(0,0,0,${Math.max(0.25, p.priorityScore / 100)})`);
          blob.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = blob;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        // Colorize: accumulated alpha (0–255) indexes into the gradient lookup.
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = image.data;
        for (let i = 3; i < px.length; i += 4) {
          const a = px[i];
          if (!a) continue;
          const j = a * 4;
          px[i - 3] = gradient[j];
          px[i - 2] = gradient[j + 1];
          px[i - 1] = gradient[j + 2];
          px[i] = gradient[j + 3];
        }
        ctx.putImageData(image, 0, 0);
      }
    }

    const overlay = new Heat();
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, points, opacity]);

  return null;
}
