import type { Route } from "./+types/cafes";
import { CafeCatalogue } from "../features/discovery/CafeCatalogue";
import { catalogueServiceFromEnv, prepareCatalogueData } from "../.server/page-data";
import { cloudflareContext } from "../../workers/app";
import { brand } from "../config/brand";

export async function loader({ context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  return prepareCatalogueData(catalogueServiceFromEnv(cloudflare.env));
}

export function meta() {
  return [
    { title: `Browse Toronto cafés · ${brand.name}` },
    {
      name: "description",
      content: `Search and filter ${brand.name}’s Toronto café guide.`,
    },
  ];
}

export default function CafesRoute({ loaderData }: Route.ComponentProps) {
  return <CafeCatalogue cafes={loaderData.cafes} source={loaderData.source} />;
}
