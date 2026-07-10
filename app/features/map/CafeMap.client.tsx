import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";

import type { Cafe } from "../../contracts/cafes";

const DEFAULT_STYLE = "https://tiles.openfreemap.org/styles/bright";

type Props = Readonly<{
  cafes: readonly Cafe[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReady: () => void;
  onError: (message: string) => void;
}>;

export default function CafeMapCanvas({
  cafes,
  selectedId,
  onSelect,
  onReady,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef(
    new Map<
      string,
      {
        marker: Marker;
        element: HTMLButtonElement;
        glyph: HTMLSpanElement;
      }
    >(),
  );
  const lastResultKeyRef = useRef("");
  const onSelectRef = useRef(onSelect);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [runtime, setRuntime] = useState<
    typeof import("maplibre-gl") | null
  >(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let disposed = false;
    let ready = false;
    let instance: MapLibreMap | null = null;

    void import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (disposed || !containerRef.current) return;

        instance = new maplibregl.Map({
          container: containerRef.current,
          style: import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE,
          center: [-79.392, 43.677],
          zoom: 10.2,
          attributionControl: false,
        });
        instance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right",
        );
        instance.addControl(
          new maplibregl.AttributionControl({
            compact: true,
          }),
        );
        instance.once("load", () => {
          ready = true;
          onReadyRef.current();
        });
        instance.once("error", () => {
          if (!ready) onErrorRef.current("The map style could not be loaded.");
        });
        setRuntime(maplibregl);
        setMap(instance);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        onErrorRef.current(
          error instanceof Error ? error.message : "The map could not be started.",
        );
      });

    return () => {
      disposed = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      instance?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map || !runtime) return;

    const cafeIds = new Set(cafes.map((cafe) => cafe.id));
    markersRef.current.forEach(({ marker }, id) => {
      if (!cafeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    for (const cafe of cafes) {
      if (markersRef.current.has(cafe.id)) continue;

      const element = document.createElement("button");
      element.type = "button";
      element.className = "cafe-map__marker";
      element.setAttribute("aria-pressed", "false");
      element.setAttribute(
        "aria-label",
        `Show ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}, ${cafe.neighborhood}`,
      );
      const glyph = document.createElement("span");
      glyph.className = "cafe-map__marker-glyph";
      glyph.setAttribute("aria-hidden", "true");
      element.appendChild(glyph);
      element.addEventListener("click", () => onSelectRef.current(cafe.id));

      const marker = new runtime.Marker({ element, anchor: "bottom" })
        .setLngLat([cafe.lng, cafe.lat])
        .addTo(map);
      markersRef.current.set(cafe.id, { marker, element, glyph });
    }

    const resultKey = [...cafeIds].sort().join("|");
    if (cafes.length > 0 && resultKey !== lastResultKeyRef.current) {
      const bounds = cafes.reduce(
        (current, cafe) => current.extend([cafe.lng, cafe.lat]),
        new runtime.LngLatBounds(
          [cafes[0].lng, cafes[0].lat],
          [cafes[0].lng, cafes[0].lat],
        ),
      );
      map.fitBounds(bounds, {
        padding: 56,
        maxZoom: 13.5,
        duration: 0,
      });
    }
    lastResultKeyRef.current = resultKey;
  }, [cafes, map, runtime]);

  useEffect(() => {
    markersRef.current.forEach(({ element, glyph }, id) => {
      const selected = id === selectedId;
      element.setAttribute("aria-pressed", String(selected));
      element.dataset.selected = String(selected);
      glyph.dataset.selected = String(selected);
    });
  }, [cafes, map, runtime, selectedId]);

  return (
    <div
      ref={containerRef}
      className="cafe-map__canvas"
      role="group"
      aria-label="Interactive Toronto café map"
    />
  );
}
