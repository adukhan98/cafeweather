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
  return <div className="shell-placeholder" aria-hidden="true" />;
}
