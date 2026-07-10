import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import type { Cafe } from "../../contracts/cafes";
import { InvitationNote } from "../brand/InvitationNote";

const CafeMapCanvas = lazy(() => import("./CafeMap.client"));

type MapStatus = "loading" | "ready" | "error";

export function CafeMap({ cafes }: { cafes: readonly Cafe[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState(cafes[0]?.id ?? null);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!cafes.some((cafe) => cafe.id === selectedId)) {
      setSelectedId(cafes[0]?.id ?? null);
    }
  }, [cafes, selectedId]);

  const selectedCafe = useMemo(
    () => cafes.find((cafe) => cafe.id === selectedId) ?? cafes[0] ?? null,
    [cafes, selectedId],
  );

  const handleReady = useCallback(() => setStatus("ready"), []);
  const handleError = useCallback((message: string) => {
    setStatus("error");
    setErrorMessage(message);
  }, []);

  return (
    <section className="cafe-map" aria-label="Toronto café map">
      <div className="cafe-map__canvas-wrap">
        {status === "loading" ? (
          <div className="cafe-map__skeleton" role="status">
            <span>Loading the Toronto map…</span>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="cafe-map__error" role="status">
            <p>Interactive map unavailable.</p>
            <p>{errorMessage} Use the complete café index beside the map.</p>
          </div>
        ) : null}
        {hydrated ? (
          <Suspense fallback={null}>
            <CafeMapCanvas
              cafes={cafes}
              selectedId={selectedCafe?.id ?? null}
              onSelect={setSelectedId}
              onReady={handleReady}
              onError={handleError}
            />
          </Suspense>
        ) : null}
      </div>

      {selectedCafe ? (
        <InvitationNote
          as="article"
          className="cafe-map__selected"
          tilt="left"
          aria-label="Selected place"
        >
          <p className="cafe-map__selected-stamp">
            {selectedCafe.branch ?? "Toronto"} · {selectedCafe.neighborhood}
          </p>
          <p className="cafe-map__selected-name">
            <a href={`/cafes/${selectedCafe.slug}`}>{selectedCafe.name}</a>
          </p>
          <p>{selectedCafe.recommendation}</p>
          <address>{selectedCafe.address}</address>
          <div className="cafe-map__selected-actions">
            <a href={`/cafes/${selectedCafe.slug}`}>Meet me there</a>
            <a href={selectedCafe.mapsUrl} target="_blank" rel="noreferrer">
              Directions
            </a>
          </div>
        </InvitationNote>
      ) : null}

      <div className="cafe-map__index">
        <div className="cafe-map__index-head">
          <p>{cafes.length === 1 ? "1 café" : `${cafes.length} cafés`}</p>
          <p>Map and list share the same filters.</p>
        </div>
        <ul aria-label="Cafés on this map">
          {cafes.map((cafe) => (
            <li key={cafe.id} data-selected={cafe.id === selectedCafe?.id}>
              <button
                type="button"
                aria-label={`Show ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
                aria-pressed={cafe.id === selectedCafe?.id}
                onClick={() => setSelectedId(cafe.id)}
              >
                <span>{cafe.name}</span>
                <span>
                  {cafe.branch ? `${cafe.branch} · ` : ""}
                  {cafe.neighborhood}
                </span>
              </button>
              <a
                href={`/cafes/${cafe.slug}`}
                aria-label={`View ${cafe.name}`}
              >
                View café
              </a>
              <a
                href={cafe.mapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
              >
                Directions
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="cafe-map__attribution">
        Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
        {" · "}
        tiles by <a href="https://openfreemap.org/">OpenFreeMap</a>
        {" · "}
        style data by <a href="https://openmaptiles.org/">OpenMapTiles</a>
      </p>
    </section>
  );
}
