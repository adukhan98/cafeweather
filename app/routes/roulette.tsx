import type { Route } from "./+types/roulette";

import {
  catalogueServiceFromEnv,
  prepareRouletteData,
} from "../.server/page-data";
import { cafes } from "../data/cafes";
import { RoulettePage } from "../features/roulette/RoulettePage";
import { cloudflareContext } from "../../workers/app";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  return prepareRouletteData(
    catalogueServiceFromEnv(cloudflare.env),
    new URL(request.url),
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Café roulette · Café Weather" },
    {
      name: "description",
      content: "Let Café Weather choose one Toronto café for your current mood.",
    },
  ];
}

export default function RouletteRoute({ loaderData }: Route.ComponentProps) {
  return (
    <RoulettePage
      cafes={cafes}
      cafe={loaderData.cafe}
      state={loaderData.state}
      seed={loaderData.seed}
    />
  );
}
