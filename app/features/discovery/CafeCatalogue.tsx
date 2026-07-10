import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { CatalogueSource } from "../../.server/services/catalogue";
import { DataSourceNotice } from "./DataSourceNotice";
import { FilterTab } from "./FilterTab";

type FacetKey = "moods" | "neighborhoods" | "offerings" | "attributes";
type CommitMode = "push" | "debounced-replace";
type ActiveFilter = Readonly<{
  key: string;
  label: string;
  aria: string;
  facet?: FacetKey;
  value?: string;
}>;

const emptyDiscoveryState: DiscoveryState = {
  search: "",
  moods: [],
  neighborhoods: [],
  offerings: [],
  attributes: [],
  view: "list",
};

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
  countFor,
}: {
  title: string;
  values: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  countFor: (value: string) => number;
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
            <FilterTab
              key={value}
              label={formatFacet(value)}
              count={countFor(value)}
              selected={selected.includes(value)}
              onSelect={() => onToggle(value)}
              onRemove={() => onToggle(value)}
            />
          ))}
        </div>
      </fieldset>
    </details>
  );
}

export function CafeCatalogue({
  cafes,
  source,
}: {
  cafes: readonly Cafe[];
  source?: CatalogueSource;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeKey = searchParams.toString();
  const initialStateRef = useRef(parseDiscoveryParams(searchParams));
  const [state, setState] = useState<DiscoveryState>(initialStateRef.current);
  const canonicalStateRef = useRef<DiscoveryState>(initialStateRef.current);
  const searchTimerRef = useRef<number | null>(null);
  const pendingRoutesRef = useRef(new Set<string>());
  const latestPendingRouteRef = useRef<string | null>(null);
  const routeKeyRef = useRef(routeKey);
  routeKeyRef.current = routeKey;
  const facets = useMemo(() => getDiscoveryFacets(cafes), [cafes]);
  const results = useMemo(
    () => filterCafes(cafes, stateToFilters(state)),
    [cafes, state],
  );
  const facetCount = useCallback(
    (facet: FacetKey, value: string) => {
      const contextualState = { ...state, [facet]: [] };
      return filterCafes(cafes, stateToFilters(contextualState)).filter((cafe) => {
        if (facet === "neighborhoods") return cafe.neighborhood === value;
        return cafe[facet].includes(value);
      }).length;
    },
    [cafes, state],
  );

  useEffect(() => {
    if (pendingRoutesRef.current.has(routeKey)) {
      if (latestPendingRouteRef.current === routeKey) {
        pendingRoutesRef.current.clear();
        latestPendingRouteRef.current = null;
      } else {
        pendingRoutesRef.current.delete(routeKey);
      }
      return;
    }

    pendingRoutesRef.current.clear();
    latestPendingRouteRef.current = null;
    const routeState = parseDiscoveryParams(new URLSearchParams(routeKey));
    if (
      serializeDiscoveryParams(canonicalStateRef.current).toString() ===
      serializeDiscoveryParams(routeState).toString()
    ) {
      return;
    }

    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    canonicalStateRef.current = routeState;
    setState(routeState);
  }, [routeKey]);

  useEffect(
    () => () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    },
    [],
  );

  const navigateToState = useCallback(
    (next: DiscoveryState, replace: boolean) => {
      const params = serializeDiscoveryParams(next);
      const nextRouteKey = params.toString();
      if (nextRouteKey !== routeKeyRef.current) {
        pendingRoutesRef.current.add(nextRouteKey);
        latestPendingRouteRef.current = nextRouteKey;
      }
      setSearchParams(params, { replace });
    },
    [setSearchParams],
  );

  const commit = useCallback(
    (
      change:
        | Partial<DiscoveryState>
        | ((current: DiscoveryState) => DiscoveryState),
      mode: CommitMode,
    ) => {
      const current = canonicalStateRef.current;
      const next =
        typeof change === "function" ? change(current) : { ...current, ...change };

      canonicalStateRef.current = next;
      setState(next);

      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }

      if (mode === "debounced-replace") {
        searchTimerRef.current = window.setTimeout(() => {
          searchTimerRef.current = null;
          navigateToState(canonicalStateRef.current, true);
        }, 180);
        return;
      }

      navigateToState(next, false);
    },
    [navigateToState],
  );

  const toggleFacet = (facet: FacetKey, value: string) => {
    commit(
      (current) => ({
        ...current,
        [facet]: toggleValue(current[facet], value),
      }),
      "push",
    );
  };

  const reset = () => {
    commit(emptyDiscoveryState, "push");
  };

  const removeActiveFilter = (filter: ActiveFilter) => {
    if (filter.key === "search") {
      commit({ search: "" }, "push");
    } else if (filter.facet && filter.value) {
      toggleFacet(filter.facet, filter.value);
    }
  };

  const activeFilters: ActiveFilter[] = [
    ...(state.search
      ? [
          {
            key: "search",
            label: `Search: ${state.search}`,
            aria: `Clear search filter ${state.search}`,
          },
        ]
      : []),
    ...state.moods.map((value) => ({
      key: `mood-${value}`,
      label: formatFacet(value),
      aria: `Clear mood filter ${formatFacet(value)}`,
      facet: "moods" as const,
      value,
    })),
    ...state.neighborhoods.map((value) => ({
      key: `neighborhood-${value}`,
      label: formatFacet(value),
      aria: `Clear neighbourhood filter ${formatFacet(value)}`,
      facet: "neighborhoods" as const,
      value,
    })),
    ...state.offerings.map((value) => ({
      key: `offering-${value}`,
      label: formatFacet(value),
      aria: `Clear offering filter ${formatFacet(value)}`,
      facet: "offerings" as const,
      value,
    })),
    ...state.attributes.map((value) => ({
      key: `attribute-${value}`,
      label: formatFacet(value),
      aria: `Clear practical attribute filter ${formatFacet(value)}`,
      facet: "attributes" as const,
      value,
    })),
  ];

  return (
    <div className="catalogue-page">
      <DataSourceNotice source={source} />
      <header className="catalogue-page__header">
        <p className="eyebrow">The whole Toronto table</p>
        <h1>Find somewhere that fits.</h1>
        <p>
          Start with a feeling, a neighbourhood, or the thing you want to order.
          Every choice stays in the link, ready to pass along.
        </p>
      </header>

      <section className="catalogue-controls" aria-label="Filter cafés">
        <div className="search-field">
          <label htmlFor="cafe-search">Search cafés</label>
          <input
            id="cafe-search"
            type="search"
            value={state.search}
            onChange={(event) => {
              commit({ search: event.currentTarget.value }, "debounced-replace");
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
            countFor={(value) => facetCount("moods", value)}
          />
          <FacetDisclosure
            title="Neighbourhoods"
            values={facets.neighborhoods}
            selected={state.neighborhoods}
            onToggle={(value) => toggleFacet("neighborhoods", value)}
            countFor={(value) => facetCount("neighborhoods", value)}
          />
          <FacetDisclosure
            title="Offerings"
            values={facets.offerings}
            selected={state.offerings}
            onToggle={(value) => toggleFacet("offerings", value)}
            countFor={(value) => facetCount("offerings", value)}
          />
        </div>

        <section className="active-filters" aria-label="Active filters">
          <div className="active-filters__head">
            <h2>Active filters</h2>
            <p>
              {activeFilters.length === 0
                ? "None selected"
                : `${activeFilters.length} active`}
            </p>
          </div>
          {activeFilters.length > 0 ? (
            <ul>
              {activeFilters.map((filter) => (
                <li key={filter.key}>
                  <span>{filter.label}</span>
                  <button
                    type="button"
                    aria-label={filter.aria}
                    onClick={() => removeActiveFilter(filter)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="active-filters__note">
            Practical filters aren’t shown yet because the verified records don’t contain them.
          </p>
        </section>

        <div className="catalogue-controls__footer">
          <p className="catalogue-count" role="status" aria-live="polite">
            <strong aria-hidden="true">{results.length}</strong>
            <span>{results.length === 1 ? "1 café" : `${results.length} cafés`}</span>
          </p>
          <fieldset className="view-switch">
            <legend>Result view</legend>
            <label>
              <input
                type="radio"
                name="catalogue-view"
                checked={state.view === "list"}
                onChange={() => commit({ view: "list" }, "push")}
              />
              <Rows size={18} weight="regular" aria-hidden="true" />
              <span>List view</span>
            </label>
            <label>
              <input
                type="radio"
                name="catalogue-view"
                checked={state.view === "map"}
                onChange={() => commit({ view: "map" }, "push")}
              />
              <MapTrifold size={18} weight="regular" aria-hidden="true" />
              <span>Map view</span>
            </label>
          </fieldset>
          {results.length > 0 && activeFilters.length > 0 ? (
            <button type="button" className="reset-button" onClick={reset}>
              Reset the whole plan
            </button>
          ) : null}
        </div>
      </section>

      {results.length === 0 ? (
        <section className="empty-results" aria-labelledby="empty-results-title">
          <CoffeeBean size={32} weight="regular" aria-hidden="true" />
          <h2 id="empty-results-title">Nothing fits all of that.</h2>
          <p>Pull one note off the plan, or start again with the whole city.</p>
          <div className="empty-results__filters" aria-label="Filters to remove">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => removeActiveFilter(filter)}
                aria-label={`Remove ${filter.label}`}
              >
                Remove <span>{filter.label}</span>
              </button>
            ))}
          </div>
          <button type="button" className="action-link" onClick={reset}>
            Reset the whole plan
          </button>
        </section>
      ) : (
        <div className="catalogue-results" data-mode={state.view}>
          <div className="catalogue-results__list">
            <ol className="cafe-results" aria-label="Café results">
              {results.map((cafe) => (
                <CafeRow key={cafe.id} cafe={cafe} />
              ))}
            </ol>
          </div>
          <div className="catalogue-results__map">
            <CafeMap cafes={results} />
          </div>
        </div>
      )}
    </div>
  );
}
