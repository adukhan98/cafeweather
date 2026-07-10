import type { Route } from "./+types/home";
import { DiscoveryHome } from "../features/discovery/DiscoveryHome";
import { catalogueServiceFromEnv, prepareCatalogueData } from "../.server/page-data";
import { cloudflareContext } from "../../workers/app";

export async function loader({ context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  return prepareCatalogueData(catalogueServiceFromEnv(cloudflare.env));
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Café Weather" },
    {
      name: "description",
      content: "Toronto cafés for the mood you’re in.",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <DiscoveryHome cafes={loaderData.cafes} source={loaderData.source} />;
}
