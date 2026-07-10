export function CupRing({ className = "" }: { className?: string }) {
  return <span className={`cup-ring ${className}`.trim()} aria-hidden="true" />;
}

export function RouteLine({ className = "" }: { className?: string }) {
  return <span className={`route-line ${className}`.trim()} aria-hidden="true" />;
}

export function LocationStamp({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return <span className={`location-stamp ${className}`.trim()}>{label}</span>;
}
