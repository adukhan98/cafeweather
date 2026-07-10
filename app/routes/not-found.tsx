import { brand } from "../config/brand";

export function meta() {
  return [
    { title: `Page not found · ${brand.name}` },
    {
      name: "description",
      content: `Find your way back into the ${brand.name} Toronto café guide.`,
    },
  ];
}

export default function NotFound() {
  return (
    <article className="not-found-page">
      <header className="not-found-page__header">
        <h1>That page is not on the map.</h1>
        <p>We lost the note, not the whole city.</p>
      </header>
      <nav className="not-found-page__links" aria-label="Recovery options">
        <a href="/cafes">Browse every place</a>
        <a href="/cafes?view=map">Open the map</a>
        <a href="/roulette">Try roulette</a>
      </nav>
    </article>
  );
}
