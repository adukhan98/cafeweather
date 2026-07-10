export function FilterTab({
  label,
  count,
  selected,
  onSelect,
  onRemove,
}: {
  label: string;
  count: number;
  selected: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  const action = selected ? "Remove" : "Add";
  const places = count === 1 ? "place" : "places";

  return (
    <button
      className="filter-tab"
      type="button"
      data-state={selected ? "selected" : "idle"}
      aria-pressed={selected}
      aria-label={`${action} ${label} filter, ${count} ${places}`}
      onClick={selected ? onRemove : onSelect}
    >
      <span>{label}</span>
      <span aria-hidden="true">{count} {selected ? "×" : "+"}</span>
    </button>
  );
}
