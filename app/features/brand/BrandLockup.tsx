import { brand } from "../../config/brand";

export function BrandLockup({
  descriptor = false,
  current = false,
}: {
  descriptor?: boolean;
  current?: boolean;
}) {
  return (
    <div className="brand-lockup">
      <a
        className="brand-lockup__name brand-lockup__home"
        href="/"
        aria-label={`${brand.name} home`}
        aria-current={current ? "page" : undefined}
      >
        {brand.name}
      </a>
      {descriptor ? <p className="brand-lockup__descriptor">{brand.descriptor}</p> : null}
    </div>
  );
}
