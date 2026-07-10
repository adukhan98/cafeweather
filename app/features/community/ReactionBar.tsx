import { useCallback, useEffect, useRef, useState } from "react";

import {
  reactionKinds,
  reactionLabels,
  type ReactionAggregate,
  type ReactionKind,
} from "../../contracts/community";
import {
  CommunityApiError,
  communityApi,
  type CommunityApiClient,
} from "../../lib/community-api";

type FailedMutation = Readonly<{
  desired: boolean;
  message: string;
}>;

function emptyReactions(): readonly ReactionAggregate[] {
  return reactionKinds.map((kind) => ({ kind, count: 0, active: false }));
}

function orderedReactions(
  reactions: readonly ReactionAggregate[],
): readonly ReactionAggregate[] {
  const byKind = new Map(reactions.map((reaction) => [reaction.kind, reaction]));
  return reactionKinds.map((kind) => {
    const reaction = byKind.get(kind);
    return reaction
      ? { ...reaction, count: Math.max(0, reaction.count) }
      : { kind, count: 0, active: false };
  });
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function failureCopy(error: unknown): string {
  if (error instanceof CommunityApiError) {
    if (error.timedOut) return "That reaction took too long. Try it again.";
    if (error.status === 429) {
      return error.retryAfterSeconds === undefined
        ? "Reactions are moving quickly. Try again shortly."
        : `Reactions are moving quickly. Try again in ${error.retryAfterSeconds} seconds.`;
    }
    if (error.status === 503) {
      return "Community reactions are temporarily unavailable. Try again.";
    }
    return error.message;
  }
  return "That reaction could not be saved. Try again.";
}

function reactionAriaLabel(reaction: ReactionAggregate): string {
  return `${reactionLabels[reaction.kind]}, ${reaction.count} ${
    reaction.count === 1 ? "reaction" : "reactions"
  }`;
}

export function ReactionBar({
  slug,
  api = communityApi,
}: {
  slug: string;
  api?: CommunityApiClient;
}) {
  const [reactions, setReactions] = useState(emptyReactions);
  const reactionsRef = useRef(reactions);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pending, setPending] = useState<ReadonlySet<ReactionKind>>(new Set());
  const [failures, setFailures] = useState<
    Readonly<Partial<Record<ReactionKind, FailedMutation>>>
  >({});
  const [announcement, setAnnouncement] = useState("");
  const mounted = useRef(true);
  const mutationControllers = useRef(new Map<ReactionKind, AbortController>());

  const replaceReactions = useCallback(
    (
      update: (
        previous: readonly ReactionAggregate[],
      ) => readonly ReactionAggregate[],
    ) => {
      setReactions((previous) => {
        const next = update(previous);
        reactionsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    setLoaded(false);
    setLoadError(undefined);
    setAnnouncement("Loading community reactions.");

    void api
      .getReactions(slug, controller.signal)
      .then((result) => {
        if (!mounted.current) return;
        const next = orderedReactions(result);
        reactionsRef.current = next;
        setReactions(next);
        setLoaded(true);
        setAnnouncement("Community reactions loaded.");
      })
      .catch((error: unknown) => {
        if (!mounted.current || isAbort(error)) return;
        const message = failureCopy(error);
        setLoadError(message);
        setAnnouncement(message);
      });

    return () => {
      mounted.current = false;
      controller.abort();
      for (const mutation of mutationControllers.current.values()) {
        mutation.abort();
      }
      mutationControllers.current.clear();
    };
  }, [api, loadAttempt, slug]);

  const mutate = useCallback(
    async (kind: ReactionKind, desired: boolean) => {
      if (!loaded || mutationControllers.current.has(kind)) return;
      const snapshot = reactionsRef.current.find(
        (reaction) => reaction.kind === kind,
      );
      if (!snapshot) return;

      const controller = new AbortController();
      mutationControllers.current.set(kind, controller);
      setPending((current) => new Set(current).add(kind));
      setFailures((current) => ({ ...current, [kind]: undefined }));
      replaceReactions((current) =>
        current.map((reaction) =>
          reaction.kind === kind
            ? {
                ...reaction,
                active: desired,
                count: Math.max(0, reaction.count + (desired ? 1 : -1)),
              }
            : reaction,
        ),
      );
      setAnnouncement(`${reactionLabels[kind]} reaction updating.`);

      try {
        const authoritative = await api.setReaction(
          slug,
          kind,
          desired,
          controller.signal,
        );
        if (!mounted.current) return;
        replaceReactions((current) =>
          current.map((reaction) =>
            reaction.kind === kind
              ? {
                  kind,
                  active: authoritative.active,
                  count: Math.max(0, authoritative.count),
                }
              : reaction,
          ),
        );
        setAnnouncement(`${reactionLabels[kind]} reaction saved.`);
      } catch (error) {
        if (!mounted.current || isAbort(error)) return;
        replaceReactions((current) =>
          current.map((reaction) =>
            reaction.kind === kind ? snapshot : reaction,
          ),
        );
        const message = failureCopy(error);
        setFailures((current) => ({
          ...current,
          [kind]: { desired, message },
        }));
        setAnnouncement(message);
      } finally {
        mutationControllers.current.delete(kind);
        if (mounted.current) {
          setPending((current) => {
            const next = new Set(current);
            next.delete(kind);
            return next;
          });
        }
      }
    },
    [api, loaded, replaceReactions, slug],
  );

  return (
    <div className="reaction-bar">
      <p className="reaction-bar__intro">
        Add one quick note. Each choice stays anonymous and can be changed.
      </p>
      <div
        className="reaction-bar__choices"
        role="group"
        aria-label="Community reactions"
        aria-busy={!loaded}
      >
        {reactions.map((reaction) => (
          <button
            key={reaction.kind}
            className="reaction-choice"
            type="button"
            aria-label={reactionAriaLabel(reaction)}
            aria-pressed={reaction.active}
            data-state={
              pending.has(reaction.kind)
                ? "loading"
                : reaction.active
                  ? "active"
                  : "idle"
            }
            disabled={!loaded || pending.has(reaction.kind)}
            onClick={() => void mutate(reaction.kind, !reaction.active)}
          >
            <span>{reactionLabels[reaction.kind]}</span>
            <span className="reaction-choice__count" aria-hidden="true">
              {reaction.count}
            </span>
          </button>
        ))}
      </div>

      {loadError ? (
        <div className="reaction-bar__error">
          <p>{loadError}</p>
          <button
            className="text-button"
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Retry reactions
          </button>
        </div>
      ) : null}

      {reactionKinds.map((kind) => {
        const failure = failures[kind];
        return failure ? (
          <div className="reaction-bar__error" key={kind}>
            <p>{failure.message}</p>
            <button
              className="text-button"
              type="button"
              onClick={() => void mutate(kind, failure.desired)}
              disabled={pending.has(kind)}
            >
              Retry {reactionLabels[kind]} reaction
            </button>
          </div>
        ) : null;
      })}

      <p
        className="reaction-bar__live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement || "Community reactions ready."}
      </p>
    </div>
  );
}
