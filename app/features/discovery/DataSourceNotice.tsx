import type { CatalogueSource } from "../../.server/services/catalogue";

export function DataSourceNotice({ source }: { source?: CatalogueSource }) {
  if (source !== "seed") return null;

  return (
    <aside className="data-source-notice" aria-label="Catalogue status">
      <strong>Verified snapshot in use.</strong>{" "}
      Live catalogue and community data may be unavailable; these listings are from the last verified guide snapshot.
    </aside>
  );
}
