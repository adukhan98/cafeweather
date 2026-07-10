import { ArrowLeft, ArrowSquareOut, MapPin } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import type { CatalogueSource } from "../../.server/services/catalogue";
import type { Cafe } from "../../contracts/cafes";
import { LocationStamp } from "../brand/GraphicMarks";
import { PlaceInvitation } from "../brand/PlaceInvitation";
import { ReactionBar } from "../community/ReactionBar";
import { DataSourceNotice } from "../discovery/DataSourceNotice";
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

  return `The original recommendation supports ${cafe.name} in Toronto but did not name a branch. This ${cafe.branch ?? cafe.neighborhood} address was verified independently for the guide.`;
}

function invitationAddress(value: string): string {
  return value
    .replace(/, Toronto, ON$/u, "")
    .replace(/\bSt$/u, "Street")
    .replace(/\bAve$/u, "Avenue")
    .replace(/\bRd$/u, "Road")
    .replace(/\bBlvd$/u, "Boulevard");
}

function FacetStamps({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <ul className="cafe-detail__stamps" aria-label={label}>
      {values.map((value) => (
        <li key={value}>
          <LocationStamp label={formatFacet(value)} />
        </li>
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
      <header className="cafe-detail__hero">
        <a className="cafe-detail__back" href="/cafes">
          <ArrowLeft size={18} aria-hidden="true" />
          Browse every café
        </a>
        <div className="cafe-detail__hero-copy">
          <p className="eyebrow">{cafe.neighborhood}</p>
          <h1>{cafe.name}</h1>
          {cafe.branch ? <p className="cafe-detail__branch">{cafe.branch}</p> : null}
          <address className="cafe-detail__invitation">
            Meet me at {invitationAddress(cafe.address)}.
          </address>
          <p className="visually-hidden">{cafe.address}</p>
          <a
            className="cafe-detail__directions"
            href={cafe.mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
          >
            <MapPin size={18} aria-hidden="true" />
            Get directions
          </a>
        </div>
      </header>

      <section className="cafe-detail__why" aria-labelledby="why-title">
        <div className="cafe-detail__scene-copy">
          <p className="section-number">The invitation</p>
          <h2 id="why-title">Why meet here?</h2>
          <p className="cafe-detail__recommendation">{cafe.recommendation}</p>
          <p className="cafe-detail__qualification">{branchVerification(cafe)}</p>
        </div>
      </section>

      <section className="cafe-detail__order" aria-labelledby="order-title">
        <div className="cafe-detail__scene-copy">
          <p className="section-number">The useful bit</p>
          <h2 id="order-title">What should we order or notice?</h2>
          <h3>Order or look for</h3>
          <FacetStamps label="Café offerings" values={cafe.offerings} />
          <h3>The mood</h3>
          <FacetStamps label="Café moods" values={cafe.moods} />
        </div>
      </section>

      <section className="cafe-detail__verification" aria-labelledby="verification-title">
        <div className="cafe-detail__scene-copy">
          <p className="section-number">The receipt</p>
          <h2 id="verification-title">How was this entry checked?</h2>
          <p>Verification status: {cafe.verificationStatus}.</p>
          <p>
            Address {cafe.addressVerified ? "verified" : "branch-qualified"} · Checked{" "}
            <time dateTime={cafe.verifiedAt}>{verifiedDate(cafe.verifiedAt)}</time>
          </p>
          <a href={cafe.sourceUrl} target="_blank" rel="noreferrer">
            View venue verification source
            <ArrowSquareOut size={16} aria-hidden="true" />
          </a>
          <DataSourceNotice source={source} />
        </div>
      </section>

      <section className="cafe-detail__nearby" aria-labelledby="nearby-title">
        <div className="cafe-detail__scene-copy">
          <p className="section-number">Keep the conversation going</p>
          <h2 id="nearby-title">What else is nearby?</h2>
          {nearby.length > 0 ? (
            <ol className="cafe-detail__nearby-list" aria-label="Nearby café alternatives">
              {nearby.map((entry) => (
                <li key={entry.id}><PlaceInvitation cafe={entry} headingLevel={3} /></li>
              ))}
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
        <div className="cafe-detail__scene-copy">
          <p className="section-number">Leave a coaster note</p>
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
