import type { ComponentType, FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Armchair,
  ArrowRight,
  CoffeeBean,
  Heart,
  Leaf,
  MapTrifold,
  MagnifyingGlass,
  Moon,
  Shuffle,
  UsersThree,
  type IconProps,
} from "@phosphor-icons/react";
import { useInRouterContext, useNavigate } from "react-router";

import type { Cafe } from "../../contracts/cafes";
import type { CafeFilters } from "../../contracts/filters";
import { filterCafes } from "../../domain/filter-cafes";
import { CafeRow } from "../cafes/CafeRow";
import { CafeMap } from "../map/CafeMap";
import { getDiscoveryFacets } from "./facets";
import type { CatalogueSource } from "../../.server/services/catalogue";
import { DataSourceNotice } from "./DataSourceNotice";

type OccasionOption = Readonly<{
  id: string;
  label: string;
  filters: CafeFilters;
  query: Readonly<Record<string, string>>;
  Icon: ComponentType<IconProps>;
}>;

const occasionOptions: readonly OccasionOption[] = [
  {
    id: "quiet-work",
    label: "Quiet work",
    filters: { moods: ["study-friendly"] },
    query: { mood: "study-friendly" },
    Icon: Armchair,
  },
  {
    id: "first-date",
    label: "First date",
    filters: { moods: ["cozy"] },
    query: { mood: "cozy" },
    Icon: Heart,
  },
  {
    id: "catch-up",
    label: "Catch up",
    filters: { moods: ["community"] },
    query: { mood: "community" },
    Icon: UsersThree,
  },
  {
    id: "serious-coffee",
    label: "Serious coffee",
    filters: { moods: ["coffee-nerd"] },
    query: { mood: "coffee-nerd" },
    Icon: CoffeeBean,
  },
  {
    id: "matcha-pastries",
    label: "Matcha and pastries",
    filters: { offerings: ["matcha"] },
    query: { offering: "matcha" },
    Icon: Leaf,
  },
  {
    id: "open-late",
    label: "Open late",
    filters: { moods: ["late-night"] },
    query: { mood: "late-night" },
    Icon: Moon,
  },
] as const;

const quietIds = [
  "nabulu-coffee-st-joseph",
  "bloom-cafe-wellesley",
  "project-seoul-chinatown",
] as const;

const destinationIds = [
  "teamendous-don-mills",
  "balzacs-distillery-district",
  "le-beau-croissanterie-dundas-east",
] as const;

function byIds(cafes: readonly Cafe[], ids: readonly string[]): Cafe[] {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return cafes
    .filter((cafe) => positions.has(cafe.id))
    .sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
}

function CollectionRail({
  id,
  title,
  description,
  href,
  cafes,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
  cafes: readonly Cafe[];
}) {
  return (
    <section className="collection-rail" aria-labelledby={`${id}-title`}>
      <div className="collection-rail__intro">
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
        <a href={href}>
          Explore collection <ArrowRight size={18} weight="regular" aria-hidden="true" />
        </a>
      </div>
      <ol className="cafe-results cafe-results--rail" aria-label={`${title} cafés`}>
        {cafes.map((cafe) => (
          <CafeRow key={cafe.id} cafe={cafe} headingLevel={3} />
        ))}
      </ol>
    </section>
  );
}

function SearchForm({
  value,
  onChange,
  onSubmit,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="home-search"
      role="search"
      action="/cafes"
      method="get"
      onSubmit={onSubmit}
    >
      <label htmlFor="home-cafe-search">Find a café</label>
      <div>
        <input
          id="home-cafe-search"
          name="q"
          type="search"
          value={value}
          onChange={
            onChange ? (event) => onChange(event.currentTarget.value) : undefined
          }
          placeholder="Search by name or neighbourhood"
        />
        <button type="submit" aria-label="Search cafés">
          <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function RoutedHomeSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    navigate(`/cafes?${new URLSearchParams({ q: query }).toString()}`);
  };

  return (
    <SearchForm value={search} onChange={setSearch} onSubmit={submitSearch} />
  );
}

function HomeSearch() {
  return useInRouterContext() ? <RoutedHomeSearch /> : <SearchForm />;
}

export function DiscoveryHome({
  cafes,
  source,
}: {
  cafes: readonly Cafe[];
  source?: CatalogueSource;
}) {
  const [occasionId, setOccasionId] = useState(occasionOptions[0].id);
  const selectedOccasion = occasionOptions.find(
    (option) => option.id === occasionId,
  )!;
  const matchingCafes = useMemo(
    () => filterCafes(cafes, selectedOccasion.filters),
    [cafes, selectedOccasion],
  );
  const occasionQuery = new URLSearchParams(selectedOccasion.query).toString();
  const facets = useMemo(() => getDiscoveryFacets(cafes), [cafes]);
  const quietCafes = useMemo(() => byIds(cafes, quietIds), [cafes]);
  const destinationCafes = useMemo(() => byIds(cafes, destinationIds), [cafes]);
  const mapCafes = useMemo(
    () => cafes.filter((cafe) => cafe.verificationStatus === "verified").slice(0, 10),
    [cafes],
  );

  return (
    <div className="discovery-home">
      <DataSourceNotice source={source} />
      <section className="discovery-hero">
        <div className="discovery-hero__copy">
          <h1>Toronto cafés for the mood you’re in.</h1>
          <p>
            Café Weather is a curated guide to Toronto cafés. Find the right
            atmosphere, wherever the day takes you.
          </p>

          <HomeSearch />

          <fieldset className="mood-picker">
            <legend>What kind of café fits today?</legend>
            <div className="mood-picker__options">
              {occasionOptions.map(({ id, label, Icon }) => (
                <label key={id} className="mood-choice">
                  <input
                    type="radio"
                    name="homepage-mood"
                    value={id}
                    checked={occasionId === id}
                    onChange={() => setOccasionId(id)}
                  />
                  <Icon size={25} weight="regular" aria-hidden="true" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="discovery-actions">
            <a
              className="action-link action-link--primary"
              href={`/cafes?${occasionQuery}`}
              aria-label={`Browse ${matchingCafes.length} cafés for ${selectedOccasion.label}`}
            >
              Browse {matchingCafes.length} cafés
              <ArrowRight size={18} weight="regular" aria-hidden="true" />
            </a>
            <a
              className="action-link"
              href={`/roulette?${occasionQuery}`}
              aria-label={`Roulette for ${selectedOccasion.label}`}
            >
              Try café roulette
              <Shuffle size={18} weight="regular" aria-hidden="true" />
            </a>
            <a className="action-link" href="/cafes?view=map">
              View map
              <MapTrifold size={18} weight="regular" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div id="map" className="discovery-hero__map">
          <CafeMap cafes={mapCafes} />
        </div>
      </section>

      <div id="browse" className="discovery-index">
        <CollectionRail
          id="quiet-afternoon"
          title="For a quiet afternoon"
          description="Cafés made for focus, calm, and unhurried time."
          href="/cafes?mood=study-friendly"
          cafes={quietCafes}
        />
        <CollectionRail
          id="cross-city"
          title="Worth crossing the city for"
          description="Distinctive places with a clear reason to make the trip."
          href="/cafes"
          cafes={destinationCafes}
        />

        <section className="neighborhood-index" aria-labelledby="neighborhood-title">
          <div className="neighborhood-index__intro">
            <h2 id="neighborhood-title">By neighbourhood</h2>
            <p>Explore local favourites across Toronto.</p>
          </div>
          <ul aria-label="Toronto neighbourhoods">
            {facets.neighborhoods.map((neighborhood) => {
              const count = cafes.filter((cafe) => cafe.neighborhood === neighborhood).length;
              return (
                <li key={neighborhood}>
                  <a href={`/cafes?neighborhood=${encodeURIComponent(neighborhood)}`}>
                    <span>{neighborhood}</span>
                    <span>{count}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section id="roulette" className="roulette-entry" aria-labelledby="roulette-entry-title">
        <h2 id="roulette-entry-title">Leave one café to chance.</h2>
        <p>Roulette draws only from the mood and filters you choose.</p>
        <a className="action-link" href="/roulette">
          Try café roulette
          <Shuffle size={18} weight="regular" aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
