import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Café Weather" },
    {
      name: "description",
      content: "A Toronto café discovery guide.",
    },
  ];
}

export default function Home() {
  return (
    <main>
      <h1>Café Weather</h1>
      <p>Find a Toronto café that fits the day.</p>
    </main>
  );
}
