import {
  createContext,
  createRequestHandler,
  RouterContextProvider,
  type RequestHandler,
} from "react-router";

export type AppLoadContext = {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
};

export const cloudflareContext = createContext<AppLoadContext>();

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export function createWorkerFetch(handler: RequestHandler) {
  return async (request: Request, env: Env, ctx: ExecutionContext) => {
    const loadContext = new RouterContextProvider();
    loadContext.set(cloudflareContext, { cloudflare: { env, ctx } });

    return handler(request, loadContext);
  };
}

export default { fetch: createWorkerFetch(requestHandler) } satisfies ExportedHandler<Env>;
