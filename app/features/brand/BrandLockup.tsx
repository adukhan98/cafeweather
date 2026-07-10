import { brand } from "../../config/brand";
import { useLocation } from "react-router";

export function BrandLockup({ descriptor = false }: { descriptor?: boolean }) {
  const location = useLocation();

  return (
    <div className="brand-lockup">
      <a
        className="brand-lockup__name brand-lockup__home"
        href="/"
        aria-label={`${brand.name} home`}
        aria-current={location.pathname === "/" ? "page" : undefined}
      >
        {brand.name}
      </a>
      {descriptor ? <p className="brand-lockup__descriptor">{brand.descriptor}</p> : null}
    </div>
  );
}
