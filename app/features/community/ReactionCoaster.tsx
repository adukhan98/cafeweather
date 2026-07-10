import type { ReactionKind } from "../../contracts/community";

export function ReactionCoaster({
  kind,
  label,
  count,
  active,
  pending,
  onToggle,
}: {
  kind: ReactionKind;
  label: string;
  count: number;
  active: boolean;
  pending: boolean;
  onToggle: (kind: ReactionKind, nextActive: boolean) => void;
}) {
  const countLabel = count === 1 ? "reaction" : "reactions";

  return (
    <button
      className="reaction-coaster"
      type="button"
      aria-label={`${label}, ${count} ${countLabel}`}
      aria-pressed={active}
      data-state={pending ? "loading" : active ? "active" : "idle"}
      disabled={pending}
      onClick={() => onToggle(kind, !active)}
    >
      <span className="reaction-coaster__label">{label}</span>
      <span className="reaction-coaster__count" aria-hidden="true">
        {count}
      </span>
    </button>
  );
}
