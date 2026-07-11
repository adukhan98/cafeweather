import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const DOCUMENT_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://tiles.openfreemap.org",
  "connect-src 'self' https://tiles.openfreemap.org https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
].join("; ");

export function applyDocumentSecurityHeaders(headers: Headers): void {
  headers.set("Content-Security-Policy", DOCUMENT_CONTENT_SECURITY_POLICY);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

export function createRenderErrorHandler(
  setResponseStatusCode: (status: number) => void,
  hasRenderedShell: () => boolean,
) {
  return (error: unknown) => {
    setResponseStatusCode(500);

    if (hasRenderedShell()) {
      console.error(error);
    }
  };
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");
  const onError = createRenderErrorHandler(
    (status) => {
      responseStatusCode = status;
    },
    () => shellRendered,
  );

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    { onError },
  );
  shellRendered = true;

  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  applyDocumentSecurityHeaders(responseHeaders);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
