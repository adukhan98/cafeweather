import { describe, expect, it } from "vitest";
import type { Cafe } from "../../app/contracts/cafes";
import { selectRouletteCafe } from "../../app/domain/roulette";

function cafe(id: string, overrides: Partial<Cafe> = {}): Cafe {
  return {
    id,
    slug: id,
    name: id,
    branch: null,
    address: `${id}, Toronto, ON`,
    addressVerified: true,
    neighborhood: "Toronto",
    lat: 43.65,
    lng: -79.38,
    coordinateConfidence: "poi",
    branchSpecificity: "explicit",
    verificationStatus: "verified",
    moods: ["calm"],
    offerings: ["coffee"],
    attributes: [],
    recommendation: `${id} recommendation`,
    sourceUrl: `https://example.com/${id}`,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${id}`,
    verifiedAt: "2026-07-09",
    ...overrides,
  };
}

async function expectedLowestDigestId(
  cafes: readonly Cafe[],
  seed: string,
): Promise<string> {
  const canonicalSeed = seed.normalize("NFC");
  const ranked = await Promise.all(
    cafes.map(async ({ id }) => {
      const digest = await sha256Hex(`${canonicalSeed}\u0000${id}`);

      return { digest, id };
    }),
  );

  ranked.sort((left, right) =>
    left.digest === right.digest
      ? left.id.localeCompare(right.id)
      : left.digest.localeCompare(right.digest),
  );

  return ranked[0].id;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

const cafes = [
  cafe("alpha", { moods: ["calm"], offerings: ["coffee"] }),
  cafe("bravo", { moods: ["lively"], offerings: ["tea"] }),
  cafe("charlie", { moods: ["calm"], offerings: ["tea"] }),
] as const;

describe("selectRouletteCafe", () => {
  it("returns null when no cafe matches the active filters", async () => {
    await expect(
      selectRouletteCafe(cafes, { offerings: ["pastries"] }, "today"),
    ).resolves.toBeNull();
  });

  it("selects only from cafes that match every active filter facet", async () => {
    const selected = await selectRouletteCafe(
      cafes,
      { moods: ["calm"], offerings: ["tea"] },
      "today",
    );

    expect(selected?.id).toBe("charlie");
  });

  it("deterministically returns the lexicographically lowest SHA-256 digest", async () => {
    const seed = "2026-07-09:afternoon";
    const expectedId = await expectedLowestDigestId(cafes, seed);

    const first = await selectRouletteCafe(cafes, {}, seed);
    const second = await selectRouletteCafe(cafes, {}, seed);

    expect(first?.id).toBe(expectedId);
    expect(second?.id).toBe(expectedId);
  });

  it("matches the hard-coded SHA-256 golden vector", async () => {
    const vector = {
      seed: "2026-07-09:afternoon",
      expectedId: "charlie",
      expectedDigest:
        "654b3cf8a0f93e40cb7ba5b561262a5c7a751c6e5748f7f010a42079508b2c1c",
    } as const;
    const selected = await selectRouletteCafe(cafes, {}, vector.seed);

    await expect(
      sha256Hex(`${vector.seed}\u0000${vector.expectedId}`),
    ).resolves.toBe(vector.expectedDigest);
    expect(selected?.id).toBe(vector.expectedId);
  });

  it("is invariant to catalogue input order", async () => {
    const seed = "2026-07-09:afternoon";
    const forward = await selectRouletteCafe(cafes, {}, seed);
    const reversed = await selectRouletteCafe([...cafes].reverse(), {}, seed);

    expect(forward?.id).toBe("charlie");
    expect(reversed?.id).toBe("charlie");
  });

  it("canonicalizes canonically equivalent Unicode seeds", async () => {
    const composed = await selectRouletteCafe(cafes, {}, "caf\u00e9");
    const decomposed = await selectRouletteCafe(cafes, {}, "cafe\u0301");

    expect(composed?.id).toBe(decomposed?.id);
  });

  it("avoids the previous cafe when more than one candidate remains", async () => {
    const initial = await selectRouletteCafe(cafes, {}, "today");
    const rerolled = await selectRouletteCafe(cafes, {}, "today", initial?.id);

    expect(rerolled).not.toBeNull();
    expect(rerolled?.id).not.toBe(initial?.id);
  });

  it("keeps the sole matching cafe even when it was selected previously", async () => {
    const selected = await selectRouletteCafe(
      cafes,
      { offerings: ["coffee"] },
      "today",
      "alpha",
    );

    expect(selected?.id).toBe("alpha");
  });

  it("does not mutate the catalogue or filters", async () => {
    const filters = { moods: ["calm"] } as const;
    const cafesSnapshot = structuredClone(cafes);
    const filtersSnapshot = structuredClone(filters);

    await selectRouletteCafe(cafes, filters, "today", "alpha");

    expect(cafes).toEqual(cafesSnapshot);
    expect(filters).toEqual(filtersSnapshot);
  });
});
