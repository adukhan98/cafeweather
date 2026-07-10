import type { Route } from "./+types/home";
import { cafes } from "../data/cafes";
import { DiscoveryHome } from "../features/discovery/DiscoveryHome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Café Weather" },
    {
      name: "description",
      content: "Toronto cafés for the mood you’re in.",
    },
  ];
}

export default function Home() {
  return <DiscoveryHome cafes={cafes} />;
}
