import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import {
  CatalogueRepositoryUnavailableError,
  CommunityRepositoryUnavailableError,
  D1CatalogueRepository,
  D1CommunityRepository,
} from "../../app/.server/db/repositories";
import { createApiHandler } from "../../app/.server/api-handlers";

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
          return recorded.sql.includes("INSERT INTO rate_limits")
            ? { count: 1 }
            : null;
        },
      };
      return statement;
    },
  } as unknown as D1Database;

  return { db, statements };
}

function failingD1(error: Error): D1Database {
  return {
    prepare() {
      const statement = {
        bind() {
          return statement;
        },
        async run() {
          throw error;
        },
        async all() {
          throw error;
        },
        async first() {
          throw error;
        },
      };
      return statement;
    },
  } as unknown as D1Database;
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

  it("classifies only known D1 availability failures at the adapter boundary", async () => {
    const timeout = Object.assign(new Error("D1 service timed out"), {
      code: "ETIMEDOUT",
    });
    const sqlError = new Error("D1_ERROR: no such table: cafes");

    await expect(
      new D1CatalogueRepository(failingD1(timeout)).list(),
    ).rejects.toBeInstanceOf(CatalogueRepositoryUnavailableError);
    await expect(
      new D1CommunityRepository(failingD1(timeout)).createSuggestion({
        name: "Cafe",
        address: "100 Queen Street West",
        reason: "A useful recommendation",
        visitorHash: "a".repeat(64),
      }),
    ).rejects.toBeInstanceOf(CommunityRepositoryUnavailableError);
    await expect(
      new D1CatalogueRepository(failingD1(sqlError)).list(),
    ).rejects.toBe(sqlError);
    await expect(
      new D1CommunityRepository(failingD1(sqlError)).addReaction(
        "cafe",
        "a".repeat(64),
        "cozy",
      ),
    ).rejects.toBe(sqlError);
  });

  it("falls back on failing-D1 reads and returns 503 for failing-D1 writes", async () => {
    const unavailable = Object.assign(new Error("service unavailable"), {
      code: "D1_UNAVAILABLE",
    });
    const handler = createApiHandler({
      catalogueRepository: new D1CatalogueRepository(failingD1(unavailable)),
      communityRepository: new D1CommunityRepository(failingD1(unavailable)),
      visitorSecret: "test-secret-at-least-32-characters-long",
    });

    const read = await handler(
      new Request("https://cafe-weather.test/api/v1/cafes"),
    );
    const write = await handler(
      new Request(
        "https://cafe-weather.test/api/v1/cafes/larrys-place-parkdale/reactions/cozy",
        {
          method: "PUT",
          headers: { origin: "https://cafe-weather.test" },
        },
      ),
    );

    expect(read.status).toBe(200);
    expect((await read.json()).meta.source).toBe("seed");
    expect(write.status).toBe(503);
    expect((await write.json()).error.code).toBe("community_unavailable");
  });

  it("uses an atomic upsert and expiry cleanup for rate limits", async () => {
    const { db, statements } = fakeD1();
    const repository = new D1CommunityRepository(db);

    await repository.consumeRateLimit({
      keyHash: "a".repeat(64),
      action: "reaction",
      bucket: 123,
      limit: 10,
      now: 400,
      expiresAt: 456,
    });

    expect(statements[0].sql).toContain("DELETE FROM rate_limits");
    expect(statements[1].sql).toContain("ON CONFLICT(key_hash, action, bucket)");
    expect(statements[1].sql).toContain("count = rate_limits.count + 1");
    expect(statements[1].sql).toContain("RETURNING count");
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

  it("adds hashed, expiring per-action rate-limit buckets", async () => {
    const sql = await readFile(
      new URL("../../migrations/0002_rate_limits.sql", import.meta.url),
      "utf8",
    );

    expect(sql).toContain("CREATE TABLE rate_limits");
    expect(sql).toContain("PRIMARY KEY (key_hash, action, bucket)");
    expect(sql).toContain("CHECK (length(key_hash) = 64)");
    expect(sql).toContain("expires_at");
    expect(sql).toContain("CREATE INDEX idx_rate_limits_expiry");
  });

  it("seeds all verified cafes idempotently and enables reaction FK writes", async () => {
    const [migration, rateLimitMigration, seed] = await Promise.all([
      readFile(
        new URL("../../migrations/0001_initial.sql", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../../migrations/0002_rate_limits.sql", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../../seed/dev.sql", import.meta.url), "utf8"),
    ]);
    const db = new DatabaseSync(":memory:");

    try {
      db.exec(migration);
      db.exec(rateLimitMigration);
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

  it("archives removed seed cafes without deleting their reactions", async () => {
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
      db.prepare(
        `INSERT INTO cafes
          (id, slug, name, address, neighborhood_id, latitude, longitude,
           coordinate_confidence, branch_specificity, verification_status,
           recommendation, source_url, maps_url, verified_at)
         VALUES (?, ?, ?, ?, (SELECT id FROM neighborhoods LIMIT 1), ?, ?,
                 'poi', 'explicit', 'verified', ?, ?, ?, ?)`,
      ).run(
        "removed-cafe",
        "removed-cafe",
        "Removed Cafe",
        "1 Old Street, Toronto",
        43.65,
        -79.38,
        "No longer in the verified seed.",
        "https://example.com/removed",
        "https://maps.example.com/removed",
        "2026-07-09",
      );
      db.prepare(
        `INSERT INTO reactions (id, cafe_id, visitor_hash, kind)
         VALUES (?, ?, ?, ?)`,
      ).run("reaction-old", "removed-cafe", "b".repeat(64), "cozy");

      db.exec(seed);

      expect(
        db.prepare("SELECT published FROM cafes WHERE id = ?").get("removed-cafe"),
      ).toEqual({ published: 0 });
      expect(
        db.prepare("SELECT cafe_id FROM reactions WHERE id = ?").get("reaction-old"),
      ).toEqual({ cafe_id: "removed-cafe" });
    } finally {
      db.close();
    }
  });
});
