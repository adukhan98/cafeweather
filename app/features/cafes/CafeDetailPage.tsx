import { ArrowLeft, ArrowSquareOut, MapPin } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import type { Cafe } from "../../contracts/cafes";
import { formatFacet } from "../discovery/facets";
import { CafeRow } from "./CafeRow";
import type { CatalogueSource } from "../../.server/services/catalogue";
import { DataSourceNotice } from "../discovery/DataSourceNotice";
import { ReactionBar } from "../community/ReactionBar";

function verifiedDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function branchVerification(cafe: Cafe): string {
  if (cafe.verificationStatus === "verified") {
    return "The source and address support this exact branch.";
  }

  return `The original recommendation supports ${cafe.name} in Toronto but did not name a branch. This ${cafe.branch ?? cafe.neighborhood} address was verified independently for the guide.`;
}

function FacetList({
  label,
  values,
}: {
  label: string;
  values: readonly string[];
}) {
  return (
    <ul className="cafe-detail__facet-list" aria-label={label}>
      {values.map((value) => (
        <li key={value}>{formatFacet(value)}</li>
      ))}
    </ul>
  );
}

export function CafeDetailPage({
  cafe,
  nearby = [],
  source,
  reactionBar,
}: {
  cafe: Cafe;
  nearby?: readonly Cafe[];
  source?: CatalogueSource;
  reactionBar?: ReactNode;
}) {
  return (
    <article className="cafe-detail">
      <DataSourceNotice source={source} />
      <a className="text-link cafe-detail__back" href="/cafes">
        <ArrowLeft size={18} aria-hidden="true" />
        Browse every café
      </a>

      <header className="cafe-detail__hero">
        <div>
          <p className="eyebrow">Café detail · {cafe.neighborhood}</p>
          <h1>{cafe.name}</h1>
          {cafe.branch ? <p className="cafe-detail__branch">{cafe.branch}</p> : null}
        </div>
        <p className="cafe-detail__recommendation">{cafe.recommendation}</p>
      </header>

      <div className="cafe-detail__body">
        <section className="cafe-detail__visit" aria-labelledby="visit-title">
          <p className="section-number">01</p>
          <div>
            <h2 id="visit-title">Plan the visit</h2>
            <address>{cafe.address}</address>
            <p>{cafe.neighborhood}</p>
            <a
              className="action-link"
              href={cafe.mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
            >
              <MapPin size={18} aria-hidden="true" />
              Get directions
            </a>
          </div>
        </section>

        <section className="cafe-detail__profile" aria-labelledby="profile-title">
          <p className="section-number">02</p>
          <div>
            <h2 id="profile-title">What it feels like</h2>
            <h3>Moods</h3>
            <FacetList label="Café moods" values={cafe.moods} />
            <h3>On the menu</h3>
            <FacetList label="Café offerings" values={cafe.offerings} />
          </div>
        </section>

        <section className="cafe-detail__verification" aria-labelledby="verification-title">
          <p className="section-number">03</p>
          <div>
            <h2 id="verification-title">How this entry was checked</h2>
            <p>{branchVerification(cafe)}</p>
            <p>
              Address {cafe.addressVerified ? "verified" : "branch-qualified"} · Checked{" "}
              <time dateTime={cafe.verifiedAt}>{verifiedDate(cafe.verifiedAt)}</time>
            </p>
            <a
              className="text-link"
              href={cafe.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              View venue verification source
              <ArrowSquareOut size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>

      <section className="cafe-detail__nearby" aria-labelledby="nearby-title">
        <p className="section-number">04</p>
        <div>
          <h2 id="nearby-title">Nearby alternatives</h2>
          {nearby.length > 0 ? (
            <ol className="cafe-results" aria-label="Nearby café alternatives">
              {nearby.map((entry) => <CafeRow key={entry.id} cafe={entry} headingLevel={3} />)}
            </ol>
          ) : (
            <p>No nearby verified alternative is available in this catalogue.</p>
          )}
        </div>
      </section>

      <section
        id="community-reactions"
        className="cafe-detail__community"
        aria-labelledby="community-reactions-title"
        data-reaction-slot
      >
        <p className="section-number">05</p>
        <div>
          <h2 id="community-reactions-title">How did this place feel?</h2>
          {reactionBar === undefined ? <ReactionBar slug={cafe.slug} /> : reactionBar}
        </div>
      </section>
    </article>
  );
}

export function CafeDetailNotFound({ source }: { source?: CatalogueSource }) {
  return (
    <section className="not-found-page">
      <DataSourceNotice source={source} />
      <p className="eyebrow">Café not found</p>
      <h1>That café isn’t in the guide.</h1>
      <p>The link may be out of date, or the café may still be waiting for verification.</p>
      <div className="not-found-page__actions">
        <a className="action-link" href="/cafes">Browse every café</a>
        <a className="text-link" href="/roulette">Try café roulette</a>
      </div>
    </section>
  );
}
