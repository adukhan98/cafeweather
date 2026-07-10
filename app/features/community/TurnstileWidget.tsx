import { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = Readonly<{
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}>;

type TurnstileApi = Readonly<{
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}>;

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstileApi(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-cafe-weather-turnstile]",
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile loaded without an API."));
    };
    const onError = () => reject(new Error("Turnstile script failed to load."));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.dataset.cafeWeatherTurnstile = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
}

export function TurnstileWidget({
  siteKey,
  action,
  resetNonce,
  onTokenChange,
}: {
  siteKey: string | null;
  action: string;
  resetNonce: number;
  onTokenChange: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const callback = useRef(onTokenChange);
  const previousResetNonce = useRef(resetNonce);
  const [message, setMessage] = useState("");
  callback.current = onTokenChange;

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;

    void loadTurnstileApi()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: siteKey,
          action,
          callback: (token) => {
            setMessage("Human verification complete.");
            callback.current(token);
          },
          "expired-callback": () => {
            setMessage("Human verification expired. Complete it again.");
            callback.current(null);
          },
          "error-callback": () => {
            setMessage("Human verification is unavailable. Try again shortly.");
            callback.current(null);
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setMessage("Human verification is unavailable. Try again shortly.");
        callback.current(null);
      });

    return () => {
      cancelled = true;
      const id = widgetId.current;
      if (id && window.turnstile) window.turnstile.remove(id);
      widgetId.current = undefined;
    };
  }, [action, siteKey]);

  useEffect(() => {
    if (previousResetNonce.current === resetNonce) return;
    previousResetNonce.current = resetNonce;
    const id = widgetId.current;
    if (id && window.turnstile) window.turnstile.reset(id);
    setMessage("");
    callback.current(null);
  }, [resetNonce]);

  if (!siteKey) return null;

  return (
    <div className="turnstile-widget">
      <div ref={container} />
      <p className="turnstile-widget__message" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
