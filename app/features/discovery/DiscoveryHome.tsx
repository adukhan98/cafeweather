import type { ComponentType, FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Armchair,
  ArrowRight,
  CoffeeBean,
  Heart,
  Leaf,
  MagnifyingGlass,
  Moon,
  Shuffle,
  UsersThree,
  type IconProps,
} from "@phosphor-icons/react";
import { useInRouterContext, useNavigate } from "react-router";

import type { Cafe } from "../../contracts/cafes";
import type { CatalogueSource } from "../../.server/services/catalogue";
import { CafeMap } from "../map/CafeMap";
import { CupRing, LocationStamp, RouteLine } from "../brand/GraphicMarks";
import { InvitationNote } from "../brand/InvitationNote";
import { MotionReveal } from "../brand/MotionReveal";
import { PlaceInvitation } from "../brand/PlaceInvitation";
import { Scene } from "../brand/Scene";
import { DataSourceNotice } from "./DataSourceNotice";
import { buildHomeScenes } from "./home-view-model";

const moodIcons: Record<string, ComponentType<IconProps>> = {
  "quiet-work": Armchair,
  "first-date": Heart,
  "catch-up": UsersThree,
  "serious-coffee": CoffeeBean,
  "matcha-pastries": Leaf,
  "open-late": Moon,
};

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
      <label htmlFor="home-cafe-search">What kind of place?</label>
      <div className="home-search__field">
        <input
          id="home-cafe-search"
          name="q"
          type="search"
          value={value}
          onChange={
            onChange
              ? (event) => onChange(event.currentTarget.value)
              : undefined
          }
          placeholder="quiet, matcha, Ossington…"
        />
        <button type="submit" aria-label="Search cafés">
          <MagnifyingGlass size={20} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function RoutedHomeSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  return (
    <SearchForm
      value={search}
      onChange={setSearch}
      onSubmit={(event) => {
        event.preventDefault();
        const query = search.trim();
        if (query) navigate(`/cafes?${new URLSearchParams({ q: query })}`);
      }}
    />
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
  const scenes = useMemo(() => buildHomeScenes(cafes), [cafes]);
  const [occasionId, setOccasionId] = useState("quiet-work");
  const selected = scenes.moods.find((option) => option.id === occasionId)!;
  const query = new URLSearchParams(selected.query).toString();

  return (
    <div className="discovery-home">
      <DataSourceNotice source={source} />

      <Scene
        tone="terracotta"
        className="home-hero"
        label="Meet Me There introduction"
      >
        <CupRing className="home-hero__ring" />
        <RouteLine className="home-hero__route" />
        <MotionReveal className="home-hero__copy">
          <p className="eyebrow">A Toronto café guide</p>
          <h1>Where are we meeting?</h1>
          <p className="home-hero__lede">
            Tell us what the day needs. We’ll pass back a place worth showing up
            for.
          </p>
          <HomeSearch />
        </MotionReveal>
        <InvitationNote className="home-hero__note" tilt="right">
          <p>
            For coffee people, date planners, laptop days, and the friend who
            always asks “where?”
          </p>
        </InvitationNote>
      </Scene>

      <Scene tone="cream" className="mood-scene" label="Choose today’s mood">
        <div className="mood-scene__picker">
          <h2 id="mood-scene-title">What does today need?</h2>
          <fieldset className="mood-picker" aria-labelledby="mood-scene-title">
            <legend className="visually-hidden">What does today need?</legend>
            <div className="mood-picker__options">
              {scenes.moods.map(({ id, label, count }) => {
                const Icon = moodIcons[id];
                return (
                  <label key={id} className="mood-choice">
                    <input
                      type="radio"
                      name="homepage-mood"
                      value={id}
                      checked={occasionId === id}
                      onChange={() => setOccasionId(id)}
                    />
                    <Icon size={26} aria-hidden="true" />
                    <span>{label}</span>
                    <small aria-hidden="true">{count} places</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        <div className="discovery-actions">
          <a
            className="action-link action-link--primary"
            href={`/cafes?${query}`}
            aria-label={`Browse ${selected.count} cafés for ${selected.label}`}
          >
            Browse {selected.count} cafés{" "}
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a
            className="action-link"
            href={`/roulette?${query}`}
            aria-label={`Roulette for ${selected.label}`}
          >
            Try café roulette <Shuffle size={18} aria-hidden="true" />
          </a>
        </div>
      </Scene>

      <Scene tone="terracotta" className="map-scene" label="Map suggestions">
        <div className="scene-heading">
          <p className="eyebrow">Pinned for consideration</p>
          <h2>A few places we could go</h2>
          <a href="/cafes?view=map">Open the full map</a>
        </div>
        <div id="map" className="map-scene__map">
          <CafeMap cafes={scenes.mapCafes} />
        </div>
      </Scene>

      <Scene tone="honey" className="roulette-scene" label="Café roulette">
        <CupRing className="roulette-scene__ring" />
        <MotionReveal className="roulette-scene__copy">
          <p className="eyebrow">No group chat required</p>
          <h2>Leave it to chance.</h2>
          <p>
            Set a mood. We’ll draw one verified café and give you a better
            answer than “anywhere is fine.”
          </p>
          <a className="action-link" href="/roulette">
            Spin café roulette <Shuffle size={18} aria-hidden="true" />
          </a>
        </MotionReveal>
      </Scene>

      <Scene tone="clay" className="city-trail" label="Popular café trail">
        <div className="scene-heading">
          <p className="eyebrow">Passed across the table</p>
          <h2>Places people keep mentioning</h2>
          <span className="city-trail__hint" aria-hidden="true">
            Scroll to follow the trail →
          </span>
        </div>
        {scenes.cityTrail.length > 0 ? (
          <div
            className="city-trail__scroller"
            role="region"
            aria-label="Places people keep mentioning"
            tabIndex={0}
          >
            <RouteLine className="city-trail__route" />
            <ol>
              {scenes.cityTrail.map((cafe) => (
                <li key={cafe.id}>
                  <PlaceInvitation cafe={cafe} headingLevel={3} />
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="city-trail__empty">No places are on the trail yet.</p>
        )}
      </Scene>

      <Scene
        tone="burgundy"
        className="neighborhood-scene"
        label="Browse by neighbourhood"
      >
        <div className="scene-heading">
          <p className="eyebrow">Pick a corner of the city</p>
          <h2>Meet somewhere nearby.</h2>
        </div>
        <ul className="neighborhood-roll" aria-label="Toronto neighbourhoods">
          {scenes.neighborhoods.map(({ name, count }) => (
            <li key={name}>
              <a href={`/cafes?neighborhood=${encodeURIComponent(name)}`}>
                <LocationStamp label={name} />
                <span>
                  {count} {count === 1 ? "place" : "places"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Scene>

      <Scene
        tone="terracotta"
        className="suggestion-scene"
        label="Suggest a café"
      >
        <InvitationNote as="div" tilt="left">
          <p className="eyebrow">Add to the table</p>
          <h2>Know a place?</h2>
          <p>
            Send us the Toronto café you keep recommending. We verify every
            location before it joins the guide.
          </p>
          <a className="action-link" href="/suggest">
            Pass us the name <ArrowRight size={18} aria-hidden="true" />
          </a>
        </InvitationNote>
      </Scene>
    </div>
  );
}
