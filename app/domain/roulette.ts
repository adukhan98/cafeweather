import type { Cafe } from "../contracts/cafes";
import type { CafeFilters } from "../contracts/filters";
import { filterCafes } from "./filter-cafes";

type RankedCafe = Readonly<{
  cafe: Cafe;
  digest: string;
}>;

async function rankCafe(cafe: Cafe, canonicalSeed: string): Promise<RankedCafe> {
  const input = new TextEncoder().encode(`${canonicalSeed}\u0000${cafe.id}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const digestHex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { cafe, digest: digestHex };
}

export async function selectRouletteCafe(
  cafes: readonly Cafe[],
  filters: CafeFilters,
  seed: string,
  previousId?: string,
): Promise<Cafe | null> {
  const matches = filterCafes(cafes, filters);
  const candidates =
    matches.length > 1 && previousId
      ? matches.filter(({ id }) => id !== previousId)
      : matches;

  if (candidates.length === 0) {
    return null;
  }

  const ranked = await Promise.all(
    candidates.map((cafe) => rankCafe(cafe, seed.normalize("NFC"))),
  );
  ranked.sort((left, right) =>
    left.digest === right.digest
      ? left.cafe.id.localeCompare(right.cafe.id)
      : left.digest.localeCompare(right.digest),
  );

  return ranked[0].cafe;
}
