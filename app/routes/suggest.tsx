import { data, useLoaderData, type LoaderFunctionArgs } from "react-router";

import { getVisitorIdentity } from "../.server/visitor";
import { SuggestionForm } from "../features/community/SuggestionForm";
import { FormNote } from "../features/community/FormNote";
import { InvitationNote } from "../features/brand/InvitationNote";
import { Scene } from "../features/brand/Scene";
import { cloudflareContext } from "../../workers/app";
import { brand } from "../config/brand";

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

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    Vary: "Cookie",
  });
  if (visitor?.setCookie) headers.set("Set-Cookie", visitor.setCookie);

  return data(publicData, { headers });
}

export function meta() {
  return [
    { title: `Suggest a café · ${brand.name}` },
    {
      name: "description",
      content: `Suggest an independent Toronto café for ${brand.name} to verify.`,
    },
  ];
}

export function SuggestPage({
  siteKey,
  action,
  turnstileRequired,
}: SuggestLoaderData) {
  return (
    <Scene as="article" tone="burgundy" className="suggest-page" label="Suggest a café">
      <header className="suggest-page__header">
        <p className="suggest-page__eyebrow">Pass us a note</p>
        <h1>Know a place?</h1>
        <p>
          Tell us the exact Toronto branch and why you would ask someone to meet
          you there.
        </p>
      </header>

      <div className="suggest-page__body">
        <InvitationNote as="aside" tilt="right" className="suggest-page__notes">
          <h2>Before you send</h2>
          <p>Name the exact branch whenever a café has more than one location.</p>
          <p>Independent cafés are the focus. Tim Hortons and Starbucks are out.</p>
          <p>A suggestion stays pending until we check the place and recommendation.</p>
        </InvitationNote>

        <FormNote>
          <SuggestionForm
            siteKey={siteKey}
            turnstileAction={action}
            turnstileRequired={turnstileRequired}
          />
        </FormNote>
      </div>
    </Scene>
  );
}

export default function SuggestRoute() {
  return <SuggestPage {...useLoaderData<typeof loader>()} />;
}
