import type { Route } from "./+types/home";
import { DiscoveryHome } from "../features/discovery/DiscoveryHome";
import { catalogueServiceFromEnv, prepareCatalogueData } from "../.server/page-data";
import { cloudflareContext } from "../../workers/app";
import { brand } from "../config/brand";

export async function loader({ context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  return prepareCatalogueData(catalogueServiceFromEnv(cloudflare.env));
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: `${brand.name} · ${brand.descriptor}` },
    {
      name: "description",
      content: `${brand.positioning} Find a Toronto café that fits the plan.`,
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <DiscoveryHome cafes={loaderData.cafes} source={loaderData.source} />;
}
