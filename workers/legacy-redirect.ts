const CANONICAL_ORIGIN = "https://meet-me-there.adnaankhan0901.workers.dev";

type Fetcher = (request: Request) => Promise<Response>;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function rejectedOrigin(request: Request): Response {
  return Response.json(
    {
      error: {
        code: "origin_rejected",
        message: "The request origin is not allowed.",
        requestId: request.headers.get("cf-ray") ?? crypto.randomUUID(),
      },
    },
    { status: 403 },
  );
}

export async function handleLegacyRequest(
  request: Request,
  fetcher: Fetcher = (upstream) => fetch(upstream),
): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const canonicalUrl = new URL(CANONICAL_ORIGIN);
  canonicalUrl.pathname = incomingUrl.pathname;
  canonicalUrl.search = incomingUrl.search;

  if (!incomingUrl.pathname.startsWith("/api/")) {
    return Response.redirect(canonicalUrl, 308);
  }

  if (!SAFE_METHODS.has(request.method)) {
    const suppliedOrigin = request.headers.get("origin");
    try {
      if (!suppliedOrigin || new URL(suppliedOrigin).origin !== incomingUrl.origin) {
        return rejectedOrigin(request);
      }
    } catch {
      return rejectedOrigin(request);
    }
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
