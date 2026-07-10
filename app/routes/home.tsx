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
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]">
          Toronto café discovery
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Café Weather</h1>
        <p className="mt-5 max-w-xl text-lg leading-8">
          Find a Toronto café that fits the day.
        </p>
      </div>
    </main>
  );
}
