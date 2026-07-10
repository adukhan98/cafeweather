import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import type { SuggestionInput } from "../../contracts/community";
import {
  CommunityApiError,
  communityApi,
  type CommunityApiClient,
} from "../../lib/community-api";
import { TurnstileWidget } from "./TurnstileWidget";

type FieldName =
  | "name"
  | "address"
  | "mapUrl"
  | "reason"
  | "recommendation";

type Values = Readonly<Record<FieldName | "website", string>>;
type FieldErrors = Readonly<Partial<Record<FieldName, string>>>;

const fieldOrder: readonly FieldName[] = [
  "name",
  "address",
  "mapUrl",
  "reason",
  "recommendation",
];

const initialValues: Values = {
  name: "",
  address: "",
  mapUrl: "",
  reason: "",
  recommendation: "",
  website: "",
};

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validate(values: Values): FieldErrors {
  const errors: Partial<Record<FieldName, string>> = {};
  const name = values.name.trim();
  const address = values.address.trim();
  const mapUrl = values.mapUrl.trim();
  const reason = values.reason.trim();
  const recommendation = values.recommendation.trim();

  if (name.length < 2) {
    errors.name = "Use at least 2 characters for the café name.";
  } else if (name.length > 120) {
    errors.name = "Keep the café name to 120 characters.";
  }

  if (!address && !mapUrl) {
    const message = "Add a street address or an HTTPS map link.";
    errors.address = message;
    errors.mapUrl = message;
  } else {
    if (address && address.length < 5) {
      errors.address =
        "Add a fuller street address, or leave it blank and use a map link.";
    } else if (address.length > 240) {
      errors.address = "Keep the street address to 240 characters.";
    }
    if (mapUrl && !validHttpsUrl(mapUrl)) {
      errors.mapUrl =
        "Use a complete HTTPS map link, beginning with https://.";
    } else if (mapUrl.length > 2_048) {
      errors.mapUrl = "Keep the map link to 2,048 characters.";
    }
  }

  if (reason.length < 10) {
    errors.reason =
      "Add at least 10 characters explaining why it belongs in the guide.";
  } else if (reason.length > 1_000) {
    errors.reason = "Keep the reason to 1,000 characters.";
  }
  if (recommendation.length > 500) {
    errors.recommendation = "Keep the recommendation to 500 characters.";
  }
  return errors;
}

function submissionId(): string {
  return globalThis.crypto.randomUUID();
}

function knownField(value: string): value is FieldName {
  return fieldOrder.includes(value as FieldName);
}

function requestFailureCopy(error: unknown): string {
  if (error instanceof CommunityApiError) {
    if (error.timedOut) {
      return "The suggestion took too long to send. Try again.";
    }
    if (error.status === 429) {
      return error.retryAfterSeconds === undefined
        ? "The suggestion limit was reached. Try again shortly."
        : `The suggestion limit was reached. Try again in ${error.retryAfterSeconds} seconds.`;
    }
    if (error.status === 503) {
      return "Suggestions are temporarily unavailable. Keep your notes and try again.";
    }
    return error.message;
  }
  return "The suggestion could not be sent. Keep your notes and try again.";
}

function Field({
  name,
  label,
  helper,
  error,
  required,
  children,
}: {
  name: FieldName;
  label: string;
  helper: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="suggestion-field" data-state={error ? "error" : "default"}>
      <div className="suggestion-field__label-row">
        <label htmlFor={`suggestion-${name}`}>{label}</label>
        {required ? <span aria-hidden="true">required</span> : null}
      </div>
      {children}
      <p
        id={`suggestion-${name}-help`}
        className="suggestion-field__help"
        data-error={error ? "true" : undefined}
      >
        {error ?? helper}
      </p>
    </div>
  );
}

export function SuggestionForm({
  siteKey,
  turnstileAction,
  turnstileRequired,
  api = communityApi,
}: {
  siteKey: string | null;
  turnstileAction: string;
  turnstileRequired: boolean;
  api?: CommunityApiClient;
}) {
  const [values, setValues] = useState<Values>(initialValues);
  const [touched, setTouched] = useState<ReadonlySet<FieldName>>(new Set());
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetNonce, setResetNonce] = useState(0);
  const currentSubmissionId = useRef<string | null>(null);
  const submissionAttempted = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const request = useRef<AbortController | undefined>(undefined);
  const mounted = useRef(true);
  const clientErrors = useMemo(() => validate(values), [values]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  function displayedError(name: FieldName): string | undefined {
    return (
      serverErrors[name] ??
      (touched.has(name) ? clientErrors[name] : undefined)
    );
  }

  function activeSubmissionId(): string {
    currentSubmissionId.current ??= submissionId();
    return currentSubmissionId.current;
  }

  function setField(name: keyof Values, value: string) {
    if (submissionAttempted.current) {
      currentSubmissionId.current = submissionId();
      submissionAttempted.current = false;
    }
    setValues((current) => ({ ...current, [name]: value }));
    if (knownField(name)) {
      setServerErrors((current) => {
        const next = { ...current };
        delete next[name];
        if (name === "address" || name === "mapUrl") {
          delete next.address;
          delete next.mapUrl;
        }
        return next;
      });
    }
    setFormMessage("");
  }

  function fieldProps(name: FieldName) {
    return {
      id: `suggestion-${name}`,
      name,
      value: values[name],
      "aria-describedby": `suggestion-${name}-help`,
      "aria-invalid": displayedError(name) ? ("true" as const) : undefined,
      disabled: submitting,
      onBlur: () => setTouched((current) => new Set(current).add(name)),
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setField(name, event.currentTarget.value),
    };
  }

  function focusFirstError(errors: FieldErrors) {
    const first = fieldOrder.find((name) => errors[name]);
    if (!first) return;
    form.current
      ?.querySelector<HTMLElement>(`[name="${first}"]`)
      ?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(values);
    setTouched(new Set(fieldOrder));
    setServerErrors({});
    setSuccess(false);
    if (Object.keys(errors).length > 0) {
      setFormMessage(
        "Review the highlighted fields, then send the suggestion again.",
      );
      focusFirstError(errors);
      return;
    }
    if (turnstileRequired && (!siteKey || !token)) {
      setFormMessage(
        !siteKey
          ? "Human verification is not configured. Suggestions are unavailable."
          : "Complete human verification before sending the suggestion.",
      );
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    submissionAttempted.current = true;
    setSubmitting(true);
    setFormMessage("");
    const input: SuggestionInput = {
      name: values.name.trim(),
      ...(values.address.trim() ? { address: values.address.trim() } : {}),
      ...(values.mapUrl.trim() ? { mapUrl: values.mapUrl.trim() } : {}),
      reason: values.reason.trim(),
      ...(values.recommendation.trim()
        ? { recommendation: values.recommendation.trim() }
        : {}),
      website: values.website,
      ...(token ? { turnstileToken: token } : {}),
      submissionId: activeSubmissionId(),
    };

    try {
      const result = await api.submitSuggestion(input, controller.signal);
      if (!mounted.current || result.status !== "pending") return;
      setValues(initialValues);
      setTouched(new Set());
      setServerErrors({});
      setSuccess(true);
      currentSubmissionId.current = submissionId();
      submissionAttempted.current = false;
    } catch (error) {
      if (
        !mounted.current ||
        (error instanceof DOMException && error.name === "AbortError")
      ) {
        return;
      }
      if (error instanceof CommunityApiError && error.fieldErrors) {
        const mapped: Partial<Record<FieldName, string>> = {};
        const other: string[] = [];
        for (const [name, messages] of Object.entries(error.fieldErrors)) {
          const first = messages[0];
          if (!first) continue;
          if (knownField(name)) mapped[name] = first;
          else other.push(first);
        }
        setServerErrors(mapped);
        setTouched(new Set(fieldOrder));
        if (Object.keys(mapped).length > 0) focusFirstError(mapped);
        setFormMessage(other[0] ?? requestFailureCopy(error));
      } else {
        setFormMessage(requestFailureCopy(error));
      }
    } finally {
      request.current = undefined;
      if (mounted.current) {
        setSubmitting(false);
        setToken(null);
        setResetNonce((nonce) => nonce + 1);
      }
    }
  }

  const verificationUnavailable = turnstileRequired && !siteKey;
  const verificationPending = turnstileRequired && Boolean(siteKey) && !token;

  return (
    <div className="suggestion-form-shell">
      {success ? (
        <div className="suggestion-form__success" role="status">
          <p>Thanks. Your suggestion is pending review.</p>
          <strong className="suggestion-form__success-stamp">Pending review.</strong>
          <button
            className="text-button"
            type="button"
            onClick={() => setSuccess(false)}
          >
            Suggest another café
          </button>
        </div>
      ) : null}

      <form
        ref={form}
        className="suggestion-form form-note"
        aria-label="Suggest a Toronto café"
        noValidate
        onSubmit={submit}
      >
        <Field
          name="name"
          label="Café name"
          helper="Use the name shown by the café."
          error={displayedError("name")}
          required
        >
          <input {...fieldProps("name")} type="text" maxLength={120} required />
        </Field>

        <div className="suggestion-form__location">
          <Field
            name="address"
            label="Exact branch or address"
            helper="Add this or a map link."
            error={displayedError("address")}
          >
            <input {...fieldProps("address")} type="text" maxLength={240} />
          </Field>
          <Field
            name="mapUrl"
            label="HTTPS map link"
            helper="Add this or a street address."
            error={displayedError("mapUrl")}
          >
            <input
              {...fieldProps("mapUrl")}
              type="url"
              inputMode="url"
              maxLength={2_048}
              placeholder="https://maps.google.com/…"
            />
          </Field>
        </div>

        <Field
          name="reason"
          label="Why meet there?"
          helper="Tell us what makes this branch worth checking."
          error={displayedError("reason")}
          required
        >
          <textarea
            {...fieldProps("reason")}
            maxLength={1_000}
            required
            rows={5}
          />
        </Field>

        <Field
          name="recommendation"
          label="What should we order or notice?"
          helper="Optional — a drink, pastry, seat, or time of day."
          error={displayedError("recommendation")}
        >
          <textarea {...fieldProps("recommendation")} maxLength={500} rows={3} />
        </Field>

        <div className="suggestion-form__honeypot" aria-hidden="true">
          <label htmlFor="suggestion-website">Website</label>
          <input
            id="suggestion-website"
            name="website"
            type="text"
            value={values.website}
            tabIndex={-1}
            autoComplete="off"
            disabled={submitting}
            onChange={(event) => setField("website", event.currentTarget.value)}
          />
        </div>

        <TurnstileWidget
          siteKey={siteKey}
          action={turnstileAction}
          resetNonce={resetNonce}
          onTokenChange={setToken}
        />

        <p className="suggestion-form__verification-status">
          Human check / {verificationPending || verificationUnavailable ? "waiting" : "ready"}
        </p>

        <div className="suggestion-form__submit-row">
          <button
            className="action-button"
            type="submit"
            disabled={
              submitting || verificationUnavailable || verificationPending
            }
          >
            {submitting ? "Sending the note…" : "Send the note"}
          </button>
          <p
            className="suggestion-form__form-message"
            data-state={formMessage || verificationUnavailable ? "error" : "quiet"}
            role="status"
            aria-live="polite"
          >
            {verificationUnavailable
              ? "Human verification is not configured. Suggestions are unavailable."
              : formMessage ||
                (verificationPending ? "Complete human verification to send." : "")}
          </p>
        </div>
      </form>
    </div>
  );
}
