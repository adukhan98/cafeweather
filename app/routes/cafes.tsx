import type { Route } from "./+types/cafes";
import { cafes } from "../data/cafes";
import { CafeCatalogue } from "../features/discovery/CafeCatalogue";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Browse Toronto cafés · Café Weather" },
    {
      name: "description",
      content: "Search and filter Café Weather’s complete Toronto café guide.",
    },
  ];
}

export default function CafesRoute() {
  return <CafeCatalogue cafes={cafes} />;
}
