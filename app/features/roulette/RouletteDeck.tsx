import type { Cafe } from "../../contracts/cafes";
import { useEffect, useRef } from "react";

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
    if (previousSeedRef.current !== seed) {
      previousSeedRef.current = seed;
      rerollRef.current?.focus();
    }
  }, [seed]);

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
