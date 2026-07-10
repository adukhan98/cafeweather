import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  Armchair,
  ArrowRight,
  CoffeeBean,
  Heart,
  Leaf,
  MapTrifold,
  Moon,
  Shuffle,
  UsersThree,
  type IconProps,
} from "@phosphor-icons/react";

import type { Cafe } from "../../contracts/cafes";
import { filterCafes } from "../../domain/filter-cafes";
import { CafeRow } from "../cafes/CafeRow";
import { CafeMap } from "../map/CafeMap";
import { getDiscoveryFacets } from "./facets";

type MoodOption = Readonly<{
  label: string;
  value: string;
  Icon: ComponentType<IconProps>;
}>;

const moodOptions: readonly MoodOption[] = [
  { label: "Quiet work", value: "study-friendly", Icon: Armchair },
  { label: "First date", value: "cozy", Icon: Heart },
  { label: "Catch up", value: "community", Icon: UsersThree },
  { label: "Serious coffee", value: "coffee-nerd", Icon: CoffeeBean },
  { label: "Matcha and pastries", value: "matcha", Icon: Leaf },
  { label: "Open late", value: "late-night", Icon: Moon },
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

export function DiscoveryHome({ cafes }: { cafes: readonly Cafe[] }) {
  const [mood, setMood] = useState(moodOptions[0].value);
  const selectedMood = moodOptions.find((option) => option.value === mood)!;
  const matchingCafes = useMemo(
    () => filterCafes(cafes, { moods: [mood] }),
    [cafes, mood],
  );
  const facets = useMemo(() => getDiscoveryFacets(cafes), [cafes]);
  const quietCafes = useMemo(() => byIds(cafes, quietIds), [cafes]);
  const destinationCafes = useMemo(() => byIds(cafes, destinationIds), [cafes]);
  const mapCafes = useMemo(
    () => cafes.filter((cafe) => cafe.verificationStatus === "verified").slice(0, 10),
    [cafes],
  );

  return (
    <div className="discovery-home">
      <section className="discovery-hero">
        <div className="discovery-hero__copy">
          <h1>Toronto cafés for the mood you’re in.</h1>
          <p>
            Café Weather is a curated guide to Toronto cafés. Find the right
            atmosphere, wherever the day takes you.
          </p>

          <fieldset className="mood-picker">
            <legend>What kind of café fits today?</legend>
            <div className="mood-picker__options">
              {moodOptions.map(({ label, value, Icon }) => (
                <label key={value} className="mood-choice">
                  <input
                    type="radio"
                    name="homepage-mood"
                    value={value}
                    checked={mood === value}
                    onChange={() => setMood(value)}
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
              href={`/cafes?mood=${encodeURIComponent(mood)}`}
              aria-label={`Browse ${matchingCafes.length} cafés for ${selectedMood.label}`}
            >
              Browse {matchingCafes.length} cafés
              <ArrowRight size={18} weight="regular" aria-hidden="true" />
            </a>
            <a
              className="action-link"
              href={`/roulette?mood=${encodeURIComponent(mood)}`}
              aria-label={`Roulette for ${selectedMood.label}`}
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
