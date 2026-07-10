import type { Route } from "./+types/roulette";

import {
  catalogueServiceFromEnv,
  prepareRouletteData,
} from "../.server/page-data";
import { RoulettePage } from "../features/roulette/RoulettePage";
import { cloudflareContext } from "../../workers/app";
import { brand } from "../config/brand";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  return prepareRouletteData(
    catalogueServiceFromEnv(cloudflare.env),
    new URL(request.url),
  );
}

export function meta() {
  return [
    { title: `Café roulette · ${brand.name}` },
    {
      name: "description",
      content: `Let ${brand.name} make a mood-aware Toronto café choice.`,
    },
  ];
}

export default function RouletteRoute({ loaderData }: Route.ComponentProps) {
  return (
    <RoulettePage
      cafe={loaderData.cafe}
      state={loaderData.state}
      seed={loaderData.seed}
      source={loaderData.source}
    />
  );
}
