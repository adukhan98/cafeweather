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
  const markersRef = useRef<Marker[]>([]);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [runtime, setRuntime] = useState<
    typeof import("maplibre-gl") | null
  >(null);

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
          onReady();
        });
        instance.once("error", () => {
          if (!ready) onError("The map style could not be loaded.");
        });
        setRuntime(maplibregl);
        setMap(instance);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        onError(error instanceof Error ? error.message : "The map could not be started.");
      });

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      instance?.remove();
    };
  }, [onError, onReady]);

  useEffect(() => {
    if (!map || !runtime) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = cafes.map((cafe) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "cafe-map__marker";
      element.dataset.selected = String(cafe.id === selectedId);
      element.setAttribute(
        "aria-label",
        `Show ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}, ${cafe.neighborhood}`,
      );
      element.addEventListener("click", () => onSelect(cafe.id));

      return new runtime.Marker({ element, anchor: "bottom" })
        .setLngLat([cafe.lng, cafe.lat])
        .addTo(map);
    });

    if (cafes.length > 0) {
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

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [cafes, map, onSelect, runtime, selectedId]);

  return (
    <div
      ref={containerRef}
      className="cafe-map__canvas"
      role="group"
      aria-label="Interactive Toronto café map"
    />
  );
}
