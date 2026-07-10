import type { Cafe } from "../../contracts/cafes";

export function PlaceInvitation({
  cafe,
  headingLevel = 2,
}: {
  cafe: Cafe;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;

  return (
    <article className="place-invitation">
      <p className="place-invitation__stamp">
        {cafe.branch ?? "Toronto"} · {cafe.neighborhood}
      </p>
      <Heading>
        <a href={`/cafes/${cafe.slug}`}>{cafe.name}</a>
      </Heading>
      <p className="place-invitation__recommendation">{cafe.recommendation}</p>
      <div className="place-invitation__actions">
        <a href={`/cafes/${cafe.slug}`}>Meet me there</a>
        <a href={cafe.mapsUrl} target="_blank" rel="noreferrer">
          Directions{" "}
          <span className="visually-hidden">(opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
