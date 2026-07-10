import { data } from "react-router";
import type { Route } from "./+types/cafe-detail";

import {
  catalogueServiceFromEnv,
  prepareCafeDetailData,
} from "../.server/page-data";
import {
  CafeDetailNotFound,
  CafeDetailPage,
} from "../features/cafes/CafeDetailPage";
import { cloudflareContext } from "../../workers/app";
import { brand } from "../config/brand";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  const result = await prepareCafeDetailData(
    catalogueServiceFromEnv(cloudflare.env),
    params.slug ?? "",
  );
  return data(result, { status: result.cafe ? 200 : 404 });
}

export function meta({ loaderData }: Pick<Route.MetaArgs, "loaderData">) {
  const cafe = loaderData?.cafe;
  return [
    {
      title: cafe
        ? `${cafe.name} · ${brand.name}`
        : `Café not found · ${brand.name}`,
    },
    {
      name: "description",
      content:
        cafe?.recommendation ??
        `Browse verified Toronto cafés with ${brand.name}.`,
    },
  ];
}

export default function CafeDetailRoute({ loaderData }: Route.ComponentProps) {
  return loaderData.cafe ? (
    <CafeDetailPage
      cafe={loaderData.cafe}
      nearby={loaderData.nearby}
      source={loaderData.source}
    />
  ) : (
    <CafeDetailNotFound source={loaderData.source} />
  );
}
