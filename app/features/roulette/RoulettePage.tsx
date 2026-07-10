import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { Cafe } from "../../contracts/cafes";
import type { DiscoveryState } from "../discovery/discovery-params";
import { formatFacet } from "../discovery/facets";
import type { CatalogueSource } from "../../.server/services/catalogue";
import { DataSourceNotice } from "../discovery/DataSourceNotice";
import {
  buildCatalogueParams,
  buildRouletteParams,
} from "./roulette-params";
import { RouletteDeck } from "./RouletteDeck";

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
    ...state.attributes.map(formatFacet),
  ];
}

type RoulettePageProps = {
  cafe: Cafe | null;
  state: DiscoveryState;
  seed: string;
  source?: CatalogueSource;
};

export function RoulettePage(props: RoulettePageProps) {
  const { cafe, state } = props;
  const navigate = useNavigate();
  const [rerollRequested, setRerollRequested] = useState(false);
  const rerollLatchRef = useRef(false);
  const rerollPending = rerollRequested;
  const catalogueParams = buildCatalogueParams(state);
  const filters = activeFilters(state);

  useEffect(() => {
    rerollLatchRef.current = false;
    setRerollRequested(false);
  }, [props.seed]);

  const reroll = () => {
    if (rerollLatchRef.current) return;
    rerollLatchRef.current = true;
    setRerollRequested(true);
    const params = buildRouletteParams(state, freshSeed(), cafe?.id);
    void navigate(pathWithParams("/roulette", params));
  };

  return (
    <div className="roulette-page">
      <DataSourceNotice source={props.source} />
      <header className="roulette-page__header">
        <div className="roulette-page__headline">
          <p className="eyebrow">Café roulette · one warm introduction</p>
          <h1>{cafe ? `Your café is ${cafe.name}.` : "No café fits those filters yet."}</h1>
        </div>
        <p>
          One place from the verified guide, chosen for the mood you brought with you.
        </p>
      </header>

      <section className="roulette-filters" aria-label="Roulette filters">
        <div>
          <p className="section-number">Active filters</p>
          {filters.length > 0 ? (
            <ul>{filters.map((filter) => (
              <li key={filter}>
                <span className="roulette-stamp" aria-label={`${filter} filter`}>
                  {filter.toUpperCase()}
                </span>
              </li>
            ))}</ul>
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
        <>
          <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {rerollPending ? "Choosing another café." : `Selected ${cafe.name}.`}
          </p>
          <RouletteDeck
            cafe={cafe}
            seed={props.seed}
            pending={rerollPending}
            onReroll={reroll}
          />
        </>
      ) : (
        <section className="roulette-empty">
          <p>Try clearing the filters, or browse the same combination to adjust it.</p>
          <div className="roulette-empty__actions">
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
