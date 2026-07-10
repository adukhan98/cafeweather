import { data, useLoaderData, type LoaderFunctionArgs } from "react-router";

import { getVisitorIdentity } from "../.server/visitor";
import { SuggestionForm } from "../features/community/SuggestionForm";
import { cloudflareContext } from "../../workers/app";

type SuggestEnv = Env & {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_ACTION?: string;
  VISITOR_HMAC_SECRET?: string;
};

export type SuggestLoaderData = Readonly<{
  siteKey: string | null;
  action: string;
  turnstileRequired: boolean;
}>;

function isProductionLike(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return !(
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".test")
  );
}

function validVisitorSecret(secret?: string): secret is string {
  return Boolean(secret && new TextEncoder().encode(secret).byteLength >= 32);
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { cloudflare } = context.get(cloudflareContext);
  const env = cloudflare.env as SuggestEnv;
  const publicData: SuggestLoaderData = {
    siteKey: env.TURNSTILE_SITE_KEY?.trim() || null,
    action: env.TURNSTILE_ACTION?.trim() || "suggestion",
    turnstileRequired: isProductionLike(request),
  };

  const visitor = validVisitorSecret(env.VISITOR_HMAC_SECRET)
    ? await getVisitorIdentity(request, env.VISITOR_HMAC_SECRET)
    : undefined;

  return data(publicData, {
    ...(visitor?.setCookie
      ? { headers: { "Set-Cookie": visitor.setCookie } }
      : {}),
  });
}

export function meta() {
  return [
    { title: "Suggest a café · Café Weather" },
    {
      name: "description",
      content: "Suggest an independent Toronto café for Café Weather to verify.",
    },
  ];
}

export function SuggestPage({
  siteKey,
  action,
  turnstileRequired,
}: SuggestLoaderData) {
  return (
    <article className="suggest-page">
      <header className="suggest-page__header">
        <div>
          <h1>Add a café to the weather map.</h1>
        </div>
        <p>
          Know a Toronto branch we missed? Send the location and why it belongs.
          We check every suggestion before it appears in the guide.
        </p>
      </header>

      <div className="suggest-page__body">
        <aside
          className="suggest-page__notes"
          aria-labelledby="suggest-notes-title"
        >
          <h2 id="suggest-notes-title">Before you send</h2>
          <ul>
            <li>
              Name the exact branch whenever a café has more than one location.
            </li>
            <li>
              Independent cafés are the focus. Tim Hortons and Starbucks are out.
            </li>
            <li>
              A suggestion stays pending until the address and recommendation
              are checked.
            </li>
          </ul>
        </aside>

        <SuggestionForm
          siteKey={siteKey}
          turnstileAction={action}
          turnstileRequired={turnstileRequired}
        />
      </div>
    </article>
  );
}

export default function SuggestRoute() {
  return <SuggestPage {...useLoaderData<typeof loader>()} />;
}
