import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import {
  D1CatalogueRepository,
  D1CommunityRepository,
} from "../../app/.server/db/repositories";

type RecordedStatement = {
  sql: string;
  bindings: unknown[];
};

function fakeD1() {
  const statements: RecordedStatement[] = [];
  const db = {
    prepare(sql: string) {
      const recorded = { sql, bindings: [] as unknown[] };
      statements.push(recorded);
      const statement = {
        bind(...bindings: unknown[]) {
          recorded.bindings = bindings;
          return statement;
        },
        async run() {
          return { success: true, meta: { changes: 1 } };
        },
        async all() {
          return { success: true, results: [] };
        },
        async first() {
          return null;
        },
      };
      return statement;
    },
  } as unknown as D1Database;

  return { db, statements };
}

describe("D1 repositories", () => {
  it("uses conflict-safe prepared statements for reaction writes", async () => {
    const { db, statements } = fakeD1();
    const repository = new D1CommunityRepository(db);

    await repository.addReaction("cafe-1", "visitor-hash", "cozy");
    await repository.removeReaction("cafe-1", "visitor-hash", "cozy");

    expect(statements[0].sql).toContain("ON CONFLICT(cafe_id, visitor_hash, kind) DO NOTHING");
    expect(statements[0].bindings).toEqual([
      expect.any(String),
      "cafe-1",
      "visitor-hash",
      "cozy",
    ]);
    expect(statements[1].sql).toContain("DELETE FROM reactions");
    expect(statements[1].bindings).toEqual(["cafe-1", "visitor-hash", "cozy"]);
  });

  it("uses prepared statements for catalogue reads", async () => {
    const { db, statements } = fakeD1();
    const repository = new D1CatalogueRepository(db);

    await repository.list();
    await repository.findBySlug("cafe-1");

    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain("FROM cafes");
    expect(statements[1].sql).toContain("WHERE c.slug = ?");
    expect(statements[1].bindings).toEqual(["cafe-1"]);
  });
});

describe("initial D1 migration", () => {
  it("defines normalized catalogue, moderated suggestions, and reaction constraints", async () => {
    const sql = await readFile(
      new URL("../../migrations/0001_initial.sql", import.meta.url),
      "utf8",
    );

    for (const table of [
      "neighborhoods",
      "moods",
      "offerings",
      "cafes",
      "cafe_moods",
      "cafe_offerings",
      "suggestions",
      "reactions",
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE ${table}`));
    }
    expect(sql).toContain("PRIMARY KEY (cafe_id, visitor_hash, kind)");
    expect(sql).toMatch(/status TEXT NOT NULL DEFAULT 'pending'/);
    expect(sql).toContain("PRAGMA foreign_keys = ON");
    expect(sql).toMatch(/CREATE INDEX/);
  });

  it("seeds all verified cafes idempotently and enables reaction FK writes", async () => {
    const [migration, seed] = await Promise.all([
      readFile(
        new URL("../../migrations/0001_initial.sql", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../../seed/dev.sql", import.meta.url), "utf8"),
    ]);
    const db = new DatabaseSync(":memory:");

    try {
      db.exec(migration);
      db.exec(seed);
      db.exec(seed);

      expect(
        (db.prepare("SELECT count(*) AS count FROM cafes").get() as { count: number })
          .count,
      ).toBe(cafes.length);
      expect(
        db.prepare("SELECT id FROM cafes ORDER BY id").all().map(({ id }) => id),
      ).toEqual(cafes.map(({ id }) => id).sort());
      for (const cafe of cafes) {
        expect(
          db
            .prepare(
              `SELECT c.slug, c.name, c.branch, c.address,
                      c.address_verified AS addressVerified,
                      n.name AS neighborhood,
                      c.latitude AS lat, c.longitude AS lng,
                      c.recommendation, c.source_url AS sourceUrl,
                      c.maps_url AS mapsUrl, c.verified_at AS verifiedAt
               FROM cafes c
               JOIN neighborhoods n ON n.id = c.neighborhood_id
               WHERE c.id = ?`,
            )
            .get(cafe.id),
        ).toEqual({
          slug: cafe.slug,
          name: cafe.name,
          branch: cafe.branch,
          address: cafe.address,
          addressVerified: cafe.addressVerified ? 1 : 0,
          neighborhood: cafe.neighborhood,
          lat: cafe.lat,
          lng: cafe.lng,
          recommendation: cafe.recommendation,
          sourceUrl: cafe.sourceUrl,
          mapsUrl: cafe.mapsUrl,
          verifiedAt: cafe.verifiedAt,
        });
        expect(
          db
            .prepare(
              `SELECT m.slug
               FROM cafe_moods cm JOIN moods m ON m.id = cm.mood_id
               WHERE cm.cafe_id = ? ORDER BY m.slug`,
            )
            .all(cafe.id)
            .map(({ slug }) => slug),
        ).toEqual([...cafe.moods].sort());
        expect(
          db
            .prepare(
              `SELECT o.slug
               FROM cafe_offerings co JOIN offerings o ON o.id = co.offering_id
               WHERE co.cafe_id = ? ORDER BY o.slug`,
            )
            .all(cafe.id)
            .map(({ slug }) => slug),
        ).toEqual([...cafe.offerings].sort());
      }
      expect(
        (
          db
            .prepare("SELECT count(*) AS count FROM cafe_moods")
            .get() as { count: number }
        ).count,
      ).toBe(cafes.reduce((count, cafe) => count + cafe.moods.length, 0));
      expect(
        (
          db
            .prepare("SELECT count(*) AS count FROM cafe_offerings")
            .get() as { count: number }
        ).count,
      ).toBe(cafes.reduce((count, cafe) => count + cafe.offerings.length, 0));

      db.prepare(
        `INSERT INTO reactions (id, cafe_id, visitor_hash, kind)
         VALUES (?, ?, ?, ?)`,
      ).run("reaction-1", cafes[0].id, "a".repeat(64), "cozy");
      expect(
        (db.prepare("SELECT count(*) AS count FROM reactions").get() as { count: number })
          .count,
      ).toBe(1);
      db.prepare(
        "DELETE FROM reactions WHERE cafe_id = ? AND visitor_hash = ? AND kind = ?",
      ).run(cafes[0].id, "a".repeat(64), "cozy");
      expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally {
      db.close();
    }
  });
});
