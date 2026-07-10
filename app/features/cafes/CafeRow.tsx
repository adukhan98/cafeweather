import type { Cafe } from "../../contracts/cafes";
import { formatFacet } from "../discovery/facets";

export function CafeRow({
  cafe,
  headingLevel = 2,
}: {
  cafe: Cafe;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <li className="cafe-row">
      <p className="cafe-row__index" aria-hidden="true">Meet me</p>
      <div className="cafe-row__identity">
        <Heading className="cafe-row__name">
          <a href={`/cafes/${cafe.slug}`}>{cafe.name}</a>
        </Heading>
        <p>
          {cafe.branch ? `${cafe.branch} · ` : ""}
          {cafe.neighborhood}
        </p>
      </div>
      <p className="cafe-row__mood">{formatFacet(cafe.moods[0] ?? "Toronto café")}</p>
      <p className="cafe-row__recommendation">{cafe.recommendation}</p>
      <a
        className="cafe-row__directions"
        href={cafe.mapsUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Directions to ${cafe.name}${cafe.branch ? `, ${cafe.branch}` : ""}`}
      >
        Directions
      </a>
      <a className="cafe-row__meet" href={`/cafes/${cafe.slug}`}>
        Meet me there
      </a>
    </li>
  );
}
