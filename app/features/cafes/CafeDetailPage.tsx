import { ArrowLeft, ArrowSquareOut, MapPin } from "@phosphor-icons/react";

import type { Cafe } from "../../contracts/cafes";
import { formatFacet } from "../discovery/facets";

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

  return `The source supports ${cafe.name} in Toronto, but it did not name this exact ${cafe.branch ?? cafe.neighborhood} branch.`;
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

export function CafeDetailPage({ cafe }: { cafe: Cafe }) {
  return (
    <article className="cafe-detail">
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
              View verification source
              <ArrowSquareOut size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>

      <section
        id="community-reactions"
        className="cafe-detail__community"
        aria-labelledby="community-reactions-title"
        data-reaction-slot
      >
        <p className="section-number">04</p>
        <div>
          <h2 id="community-reactions-title">How did this place feel?</h2>
          <p>Quick community reactions are coming in the next product pass.</p>
        </div>
      </section>
    </article>
  );
}

export function CafeDetailNotFound() {
  return (
    <section className="not-found-page">
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
