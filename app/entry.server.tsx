import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

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
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
