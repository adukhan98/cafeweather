import { ArrowRight, ArrowsClockwise, MapPin } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

import type { Cafe } from "../../contracts/cafes";
import type { DiscoveryState } from "../discovery/discovery-params";
import { formatFacet } from "../discovery/facets";
import {
  buildCatalogueParams,
  buildRouletteParams,
  initialRouletteSeed,
} from "./roulette-params";

export { buildRouletteParams, initialRouletteSeed } from "./roulette-params";

function pathWithParams(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function freshSeed(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const values = crypto.getRandomValues(new Uint32Array(4));
  return Array.from(values, (value) => value.toString(16)).join("-");
}

function activeFilters(state: DiscoveryState): string[] {
  return [
    ...(state.search ? [`Search: ${state.search}`] : []),
    ...state.moods.map(formatFacet),
    ...state.neighborhoods.map(formatFacet),
    ...state.offerings.map(formatFacet),
  ];
}

type RoulettePageProps = {
  cafes: readonly Cafe[];
  cafe: Cafe | null;
  state: DiscoveryState;
  seed: string;
};

export function RoulettePage(props: RoulettePageProps) {
  const { cafe, state } = props;
  const navigate = useNavigate();
  const catalogueParams = buildCatalogueParams(state);
  const filters = activeFilters(state);

  const reroll = () => {
    const params = buildRouletteParams(state, freshSeed(), cafe?.id);
    void navigate(pathWithParams("/roulette", params));
  };

  return (
    <div className="roulette-page">
      <header className="roulette-page__header">
        <p className="eyebrow">Café roulette · one considered pick</p>
        <h1>{cafe ? `Your café is ${cafe.name}.` : "No café fits those filters yet."}</h1>
        <p>
          One place from the verified guide, chosen for the mood you brought with you.
        </p>
      </header>

      <section className="roulette-filters" aria-label="Roulette filters">
        <div>
          <p className="section-number">Active filters</p>
          {filters.length > 0 ? (
            <ul>{filters.map((filter) => <li key={filter}>{filter}</li>)}</ul>
          ) : (
            <p>All Toronto cafés</p>
          )}
        </div>
        <a className="text-link" href={pathWithParams("/cafes", catalogueParams)}>
          Change active filters
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>

      {cafe ? (
        <article className="roulette-reveal" key={`${cafe.id}-${props.seed}`}>
          <p className="section-number">Today’s pick</p>
          <div className="roulette-reveal__identity">
            <p>{cafe.branch ? `${cafe.branch} · ` : ""}{cafe.neighborhood}</p>
            <h2>{cafe.name}</h2>
          </div>
          <p className="roulette-reveal__reason">{cafe.recommendation}</p>
          <div className="roulette-actions">
            <a className="action-link" href={`/cafes/${cafe.slug}`}>
              See café details
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              className="text-link"
              href={cafe.mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
            >
              <MapPin size={18} aria-hidden="true" />
              Directions
            </a>
            <button type="button" className="text-link" onClick={reroll}>
              <ArrowsClockwise size={18} aria-hidden="true" />
              Reroll
            </button>
          </div>
        </article>
      ) : (
        <section className="roulette-empty">
          <p>Try clearing the filters, or browse the same combination to adjust it.</p>
          <div className="roulette-actions">
            <a className="action-link" href="/roulette">Clear filters and try again</a>
            <a className="text-link" href={pathWithParams("/cafes", catalogueParams)}>
              Browse with these filters
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
