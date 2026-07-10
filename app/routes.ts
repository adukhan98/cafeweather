import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("cafes", "routes/cafes.tsx"),
  route("cafes/:slug", "routes/cafe-detail.tsx"),
  route("roulette", "routes/roulette.tsx"),
  route("suggest", "routes/suggest.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("*", "routes/not-found.tsx"),
  route("api/v1/facets", "routes/api.facets.ts"),
  route("api/v1/cafes", "routes/api.cafes.ts"),
  route("api/v1/cafes/:slug", "routes/api.cafe-detail.ts"),
  route("api/v1/roulette", "routes/api.roulette.ts"),
  route("api/v1/suggestions", "routes/api.suggestions.ts"),
  route(
    "api/v1/cafes/:cafeId/reactions",
    "routes/api.reactions.ts",
  ),
  route(
    "api/v1/cafes/:cafeId/reactions/:kind",
    "routes/api.reaction.ts",
  ),
] satisfies RouteConfig;
