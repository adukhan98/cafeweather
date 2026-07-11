const CANONICAL_ORIGIN = "https://meet-me-there.adnaankhan0901.workers.dev";

type Fetcher = (request: Request) => Promise<Response>;

export async function handleLegacyRequest(
  request: Request,
  fetcher: Fetcher = (upstream) => fetch(upstream),
): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const canonicalUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, CANONICAL_ORIGIN);

  if (!incomingUrl.pathname.startsWith("/api/")) {
    return Response.redirect(canonicalUrl, 308);
  }

  // Constructing from the incoming Request preserves streaming-body semantics in
  // both Workers and Node-compatible runtimes without forwarding to a dynamic host.
  const headers = new Headers(request.headers);
  headers.set("origin", CANONICAL_ORIGIN);
  const upstreamRequest = new Request(canonicalUrl, request);
  const manualRedirectRequest = new Request(upstreamRequest, {
    headers,
    redirect: "manual",
  });
  return fetcher(manualRedirectRequest);
}

export default {
  fetch(request: Request): Promise<Response> {
    return handleLegacyRequest(request);
  },
};
