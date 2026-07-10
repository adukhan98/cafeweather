import type { RouterContextProvider } from "react-router";
import { cloudflareContext } from "../../workers/app";
import { createApiHandlerFromEnv } from "./api-handlers";

export function handleApiResource({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) {
  const { cloudflare } = context.get(cloudflareContext);
  return createApiHandlerFromEnv(cloudflare.env)(request);
}
