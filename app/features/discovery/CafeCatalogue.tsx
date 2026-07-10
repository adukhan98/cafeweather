import { useEffect, useMemo, useRef, useState } from "react";
import { CoffeeBean, MapTrifold, Rows } from "@phosphor-icons/react";
import { useSearchParams } from "react-router";

import type { Cafe } from "../../contracts/cafes";
import { filterCafes } from "../../domain/filter-cafes";
import { CafeRow } from "../cafes/CafeRow";
import { CafeMap } from "../map/CafeMap";
import {
  parseDiscoveryParams,
  serializeDiscoveryParams,
  stateToFilters,
  type DiscoveryState,
} from "./discovery-params";
import { formatFacet, getDiscoveryFacets } from "./facets";

type FacetKey = "moods" | "neighborhoods" | "offerings";

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

function FacetDisclosure({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  return (
    <details className="facet-disclosure">
      <summary aria-label={`${title} filters`}>
        <span>{title}</span>
        <span>{selected.length > 0 ? selected.length : "All"}</span>
      </summary>
      <fieldset>
        <legend>{title}</legend>
        <div className="facet-disclosure__options">
          {values.map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
              />
              <span>{formatFacet(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </details>
  );
}

export function CafeCatalogue({ cafes }: { cafes: readonly Cafe[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseDiscoveryParams(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(state.search);
  const committedSearchRef = useRef(state.search);
  const facets = useMemo(() => getDiscoveryFacets(cafes), [cafes]);
  const results = useMemo(
    () =>
      filterCafes(
        cafes,
        stateToFilters({
          ...state,
          search: searchDraft,
        }),
      ),
    [cafes, searchDraft, state],
  );

  useEffect(() => {
    if (state.search === committedSearchRef.current) return;
    committedSearchRef.current = state.search;
    setSearchDraft(state.search);
  }, [state.search]);

  useEffect(() => {
    if (searchDraft === state.search) return;

    const timeout = window.setTimeout(() => {
      committedSearchRef.current = searchDraft;
      setSearchParams(
        (currentParams) =>
          serializeDiscoveryParams({
            ...parseDiscoveryParams(currentParams),
            search: searchDraft,
          }),
        { replace: true },
      );
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [searchDraft, setSearchParams, state.search]);

  const update = (patch: Partial<DiscoveryState>) => {
    setSearchParams(
      (currentParams) =>
        serializeDiscoveryParams({
          ...parseDiscoveryParams(currentParams),
          ...patch,
        }),
      { replace: true },
    );
  };

  const toggleFacet = (facet: FacetKey, value: string) => {
    update({ [facet]: toggleValue(state[facet], value) });
  };

  const reset = () => {
    committedSearchRef.current = "";
    setSearchDraft("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="catalogue-page">
      <header className="catalogue-page__header">
        <h1>Every café in the guide.</h1>
        <p>
          Search all {cafes.length} verified or branch-qualified Toronto entries.
          Filters combine across categories and stay shareable in the URL.
        </p>
      </header>

      <section className="catalogue-controls" aria-label="Filter cafés">
        <div className="search-field">
          <label htmlFor="cafe-search">Search cafés</label>
          <input
            id="cafe-search"
            type="search"
            value={searchDraft}
            onChange={(event) => {
              setSearchDraft(event.currentTarget.value);
            }}
            placeholder="Name, area, or recommendation"
          />
          <p>Searches names, neighbourhoods, branches, and editorial notes.</p>
        </div>

        <div className="catalogue-controls__facets">
          <FacetDisclosure
            title="Moods"
            values={facets.moods}
            selected={state.moods}
            onToggle={(value) => toggleFacet("moods", value)}
          />
          <FacetDisclosure
            title="Neighbourhoods"
            values={facets.neighborhoods}
            selected={state.neighborhoods}
            onToggle={(value) => toggleFacet("neighborhoods", value)}
          />
          <FacetDisclosure
            title="Offerings"
            values={facets.offerings}
            selected={state.offerings}
            onToggle={(value) => toggleFacet("offerings", value)}
          />
        </div>

        <div className="catalogue-controls__footer">
          <p role="status" aria-live="polite">
            {results.length === 1 ? "1 café" : `${results.length} cafés`}
          </p>
          <fieldset className="view-switch">
            <legend>Result view</legend>
            <label>
              <input
                type="radio"
                name="catalogue-view"
                checked={state.view === "list"}
                onChange={() => update({ view: "list" })}
              />
              <Rows size={18} weight="regular" aria-hidden="true" />
              <span>List view</span>
            </label>
            <label>
              <input
                type="radio"
                name="catalogue-view"
                checked={state.view === "map"}
                onChange={() => update({ view: "map" })}
              />
              <MapTrifold size={18} weight="regular" aria-hidden="true" />
              <span>Map view</span>
            </label>
          </fieldset>
          <button type="button" className="reset-button" onClick={reset}>
            Reset all filters
          </button>
        </div>
      </section>

      {results.length === 0 ? (
        <section className="empty-results" aria-labelledby="empty-results-title">
          <CoffeeBean size={32} weight="regular" aria-hidden="true" />
          <h2 id="empty-results-title">No cafés match those filters.</h2>
          <p>Try a broader search, remove a filter, or return to the full Toronto list.</p>
          <button type="button" className="action-link" onClick={reset}>
            Show all cafés
          </button>
        </section>
      ) : state.view === "map" ? (
        <CafeMap cafes={results} />
      ) : (
        <ol className="cafe-results" aria-label="Café results">
          {results.map((cafe) => (
            <CafeRow key={cafe.id} cafe={cafe} />
          ))}
        </ol>
      )}
    </div>
  );
}
