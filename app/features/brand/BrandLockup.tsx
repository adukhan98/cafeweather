import { brand } from "../../config/brand";

export function BrandLockup({ descriptor = false }: { descriptor?: boolean }) {
  return (
    <div className="brand-lockup">
      <a className="brand-lockup__name" href="/" aria-label={`${brand.name} home`}>
        {brand.name}
      </a>
      {descriptor ? <p className="brand-lockup__descriptor">{brand.descriptor}</p> : null}
    </div>
  );
}
