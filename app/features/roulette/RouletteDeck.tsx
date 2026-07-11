import type { Cafe } from "../../contracts/cafes";
import { useEffect, useRef } from "react";

const REROLL_FOCUS_KEY = "meet-me-there:roulette-reroll-focus";

export function markRerollFocusForNavigation() {
  try {
    window.sessionStorage.setItem(REROLL_FOCUS_KEY, "pending");
  } catch {
    // Focus still falls back to the in-place seed change when storage is unavailable.
  }
}

export function displayMatchNumber(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String((hash >>> 0) % 99 + 1).padStart(2, "0");
}

type RouletteDeckProps = {
  cafe: Cafe;
  seed: string;
  pending: boolean;
  onReroll: () => void;
};

export function RouletteDeck({ cafe, seed, pending, onReroll }: RouletteDeckProps) {
  const rerollRef = useRef<HTMLButtonElement>(null);
  const previousSeedRef = useRef(seed);

  useEffect(() => {
    let navigationRequestedFocus = false;
    try {
      navigationRequestedFocus =
        window.sessionStorage.getItem(REROLL_FOCUS_KEY) === "pending";
    } catch {
      // Storage can be unavailable in hardened browsing modes.
    }
    const resultChanged = previousSeedRef.current !== seed;
    if (pending || (!navigationRequestedFocus && !resultChanged)) return;

    previousSeedRef.current = seed;
    if (navigationRequestedFocus) {
      try {
        window.sessionStorage.removeItem(REROLL_FOCUS_KEY);
      } catch {
        // The focus action itself does not depend on clearing unavailable storage.
      }
    }
    rerollRef.current?.focus();
  }, [pending, seed]);

  return (
    <div className="roulette-deck" aria-busy={pending}>
      <article
        className="roulette-result"
        aria-label="Roulette result"
        data-motion="deck"
        key={seed}
      >
        <div className="roulette-result__heading">
          <p className="eyebrow">Tonight · match {displayMatchNumber(seed)}</p>
          <h2>{cafe.name}</h2>
        </div>
        <p className="roulette-result__location">
          {cafe.branch && cafe.branch !== cafe.neighborhood
            ? `${cafe.branch} · ${cafe.neighborhood}`
            : cafe.neighborhood}
        </p>
        <p className="roulette-result__recommendation">{cafe.recommendation}</p>
        <div className="roulette-deck__actions">
          <a href={`/cafes/${cafe.slug}`}>Meet me there</a>
          <a
            href={cafe.mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
          >
            Directions
          </a>
        </div>
      </article>
      <div className="roulette-deck__actions roulette-deck__reroll">
        <button ref={rerollRef} type="button" onClick={onReroll} disabled={pending}>
          {pending ? "Choosing…" : "Reroll"}
        </button>
      </div>
    </div>
  );
}
