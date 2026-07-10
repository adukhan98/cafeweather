import { brand } from "../config/brand";

export function meta() {
  return [
    { title: `Terms · ${brand.name}` },
    {
      name: "description",
      content: `Terms for using the ${brand.name} Toronto café guide.`,
    },
  ];
}

export default function Terms() {
  return (
    <article className="legal-page legal-page--terms">
      <header className="legal-page__header">
        <h1>A guide, not a guarantee.</h1>
      </header>
      <div className="legal-page__content">
        <p>
          Listings are editorial and verified branch by branch, but we cannot
          guarantee real-time hours, accessibility, pricing, menus, or
          availability. Please verify hours and accessibility directly with the
          venue before you go.
        </p>
        <p>
          Directions open in external services, whose information and terms
          apply. Community suggestions are moderated before they appear.
        </p>
        <p>
          Use the guide respectfully. Do not submit abusive, misleading, or
          unlawful material or attempt to disrupt the service.
        </p>
      </div>
    </article>
  );
}
