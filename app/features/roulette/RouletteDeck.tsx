import type { Cafe } from "../../contracts/cafes";
import { displayMatchNumber } from "./roulette-params";

type RouletteDeckProps = {
  cafe: Cafe;
  seed: string;
  pending: boolean;
  onReroll: () => void;
};

export function RouletteDeck({ cafe, seed, pending, onReroll }: RouletteDeckProps) {
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
        <button type="button" onClick={onReroll} disabled={pending}>
          {pending ? "Choosing…" : "Reroll"}
        </button>
      </div>
    </div>
  );
}
