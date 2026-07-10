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

export async function loader({ params, context }: Route.LoaderArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  const result = await prepareCafeDetailData(
    catalogueServiceFromEnv(cloudflare.env),
    params.slug ?? "",
  );
  return data(result, { status: result.cafe ? 200 : 404 });
}

export function meta({ loaderData }: Route.MetaArgs) {
  const cafe = loaderData?.cafe;
  return [
    { title: cafe ? `${cafe.name} · Café Weather` : "Café not found · Café Weather" },
    {
      name: "description",
      content: cafe?.recommendation ?? "Browse verified Toronto cafés with Café Weather.",
    },
  ];
}

export default function CafeDetailRoute({ loaderData }: Route.ComponentProps) {
  return loaderData.cafe ? (
    <CafeDetailPage cafe={loaderData.cafe} />
  ) : (
    <CafeDetailNotFound />
  );
}
