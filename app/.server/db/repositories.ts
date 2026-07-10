import type { Cafe } from "../../contracts/cafes";
import type { ReactionKind } from "../../contracts/community";

export type SuggestionRecord = Readonly<{
  id: string;
  name: string;
  address?: string;
  mapUrl?: string;
  reason: string;
  recommendation?: string;
  visitorHash: string;
}>;

export type PendingSuggestion = Readonly<{
  id: string;
  status: "pending";
}>;

export type ReactionAggregateRecord = Readonly<{
  kind: ReactionKind;
  count: number;
  active: boolean;
}>;

export interface CatalogueRepository {
  list(): Promise<readonly Cafe[]>;
  findBySlug(slug: string): Promise<Cafe | null>;
}

export class CatalogueRepositoryUnavailableError extends Error {
  override readonly name = "CatalogueRepositoryUnavailableError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class CommunityRepositoryUnavailableError extends Error {
  override readonly name = "CommunityRepositoryUnavailableError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class SuggestionReplayConflictError extends Error {
  override readonly name = "SuggestionReplayConflictError";

  constructor() {
    super("The submission key was already used for different suggestion data.");
  }
}

export type RateLimitAttempt = Readonly<{
  keyHash: string;
  action: "reaction" | "suggestion";
  bucket: number;
  limit: number;
  now: number;
  expiresAt: number;
}>;

export type RateLimitResult = Readonly<{
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
}>;

export interface CommunityRepository {
  addReaction(
    cafeId: string,
    visitorHash: string,
    kind: ReactionKind,
  ): Promise<boolean>;
  removeReaction(
    cafeId: string,
    visitorHash: string,
    kind: ReactionKind,
  ): Promise<boolean>;
  listReactions(
    cafeId: string,
    visitorHash: string,
  ): Promise<readonly ReactionAggregateRecord[]>;
  createSuggestion(suggestion: SuggestionRecord): Promise<PendingSuggestion>;
  consumeRateLimit(attempt: RateLimitAttempt): Promise<RateLimitResult>;
}

const AVAILABILITY_CODES = new Set([
  "D1_UNAVAILABLE",
  "D1_TIMEOUT",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function isKnownAvailabilityFailure(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: unknown }).code;
  if (typeof code === "string" && AVAILABILITY_CODES.has(code)) return true;
  if (["AbortError", "NetworkError", "TimeoutError"].includes(error.name)) {
    return true;
  }
  return /\b(?:network (?:error|failure)|service unavailable|temporarily unavailable|timed out|connection (?:refused|reset))\b/iu.test(
    error.message,
  );
}

function catalogueFailure(error: unknown): never {
  if (isKnownAvailabilityFailure(error)) {
    throw new CatalogueRepositoryUnavailableError(
      "The D1 catalogue is temporarily unavailable.",
      { cause: error },
    );
  }
  throw error;
}

function communityFailure(error: unknown): never {
  if (isKnownAvailabilityFailure(error)) {
    throw new CommunityRepositoryUnavailableError(
      "The D1 community store is temporarily unavailable.",
      { cause: error },
    );
  }
  throw error;
}

type CafeRow = {
  id: string;
  slug: string;
  name: string;
  branch: string | null;
  address: string;
  address_verified: number;
  neighborhood: string;
  latitude: number;
  longitude: number;
  coordinate_confidence: Cafe["coordinateConfidence"];
  branch_specificity: Cafe["branchSpecificity"];
  verification_status: Cafe["verificationStatus"];
  moods_json: string;
  offerings_json: string;
  attributes_json: string;
  recommendation: string;
  source_url: string;
  maps_url: string;
  verified_at: string;
};

const CAFE_SELECT = `
  SELECT
    c.id,
    c.slug,
    c.name,
    c.branch,
    c.address,
    c.address_verified,
    n.name AS neighborhood,
    c.latitude,
    c.longitude,
    c.coordinate_confidence,
    c.branch_specificity,
    c.verification_status,
    COALESCE((
      SELECT json_group_array(m.slug)
      FROM cafe_moods cm
      JOIN moods m ON m.id = cm.mood_id
      WHERE cm.cafe_id = c.id
      ORDER BY m.slug
    ), '[]') AS moods_json,
    COALESCE((
      SELECT json_group_array(o.slug)
      FROM cafe_offerings co
      JOIN offerings o ON o.id = co.offering_id
      WHERE co.cafe_id = c.id
      ORDER BY o.slug
    ), '[]') AS offerings_json,
    c.attributes_json,
    c.recommendation,
    c.source_url,
    c.maps_url,
    c.verified_at
  FROM cafes c
  JOIN neighborhoods n ON n.id = c.neighborhood_id
`;

function parseStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function mapCafeRow(row: CafeRow): Cafe {
  const common = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    branch: row.branch,
    address: row.address,
    addressVerified: row.address_verified === 1,
    neighborhood: row.neighborhood,
    lat: row.latitude,
    lng: row.longitude,
    coordinateConfidence: row.coordinate_confidence,
    moods: parseStringArray(row.moods_json),
    offerings: parseStringArray(row.offerings_json),
    attributes: parseStringArray(row.attributes_json),
    recommendation: row.recommendation,
    sourceUrl: row.source_url,
    mapsUrl: row.maps_url,
    verifiedAt: row.verified_at,
  };

  if (row.branch_specificity === "explicit") {
    return {
      ...common,
      branchSpecificity: "explicit",
      verificationStatus: "verified",
    };
  }

  return {
    ...common,
    branchSpecificity: row.branch_specificity,
    verificationStatus: "branch-unspecified",
  };
}

export class D1CatalogueRepository implements CatalogueRepository {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<readonly Cafe[]> {
    try {
      const result = await this.db
        .prepare(`${CAFE_SELECT} WHERE c.published = 1 ORDER BY c.name, c.branch`)
        .all<CafeRow>();
      return result.results.map(mapCafeRow);
    } catch (error) {
      return catalogueFailure(error);
    }
  }

  async findBySlug(slug: string): Promise<Cafe | null> {
    try {
      const row = await this.db
        .prepare(`${CAFE_SELECT} WHERE c.slug = ? AND c.published = 1 LIMIT 1`)
        .bind(slug)
        .first<CafeRow>();
      return row ? mapCafeRow(row) : null;
    } catch (error) {
      return catalogueFailure(error);
    }
  }
}

export class D1CommunityRepository implements CommunityRepository {
  constructor(private readonly db: D1Database) {}

  async addReaction(
    cafeId: string,
    visitorHash: string,
    kind: ReactionKind,
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(
          `INSERT INTO reactions (id, cafe_id, visitor_hash, kind)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(cafe_id, visitor_hash, kind) DO NOTHING`,
        )
        .bind(crypto.randomUUID(), cafeId, visitorHash, kind)
        .run();
      return result.meta.changes > 0;
    } catch (error) {
      return communityFailure(error);
    }
  }

  async removeReaction(
    cafeId: string,
    visitorHash: string,
    kind: ReactionKind,
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(
          `DELETE FROM reactions
           WHERE cafe_id = ? AND visitor_hash = ? AND kind = ?`,
        )
        .bind(cafeId, visitorHash, kind)
        .run();
      return result.meta.changes > 0;
    } catch (error) {
      return communityFailure(error);
    }
  }

  async listReactions(
    cafeId: string,
    visitorHash: string,
  ): Promise<readonly ReactionAggregateRecord[]> {
    try {
      const result = await this.db
        .prepare(
          `SELECT
             kind,
             COUNT(*) AS count,
             MAX(CASE WHEN visitor_hash = ? THEN 1 ELSE 0 END) AS active
           FROM reactions
           WHERE cafe_id = ?
           GROUP BY kind`,
        )
        .bind(visitorHash, cafeId)
        .all<{ kind: ReactionKind; count: number; active: number }>();
      return result.results.map(({ kind, count, active }) => ({
        kind,
        count,
        active: active === 1,
      }));
    } catch (error) {
      return communityFailure(error);
    }
  }

  async createSuggestion(
    suggestion: SuggestionRecord,
  ): Promise<PendingSuggestion> {
    try {
      const result = await this.db
        .prepare(
          `INSERT INTO suggestions
            (id, name, address, map_url, reason, recommendation, visitor_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO NOTHING`,
        )
        .bind(
          suggestion.id,
          suggestion.name,
          suggestion.address ?? null,
          suggestion.mapUrl ?? null,
          suggestion.reason,
          suggestion.recommendation ?? null,
          suggestion.visitorHash,
        )
        .run();
      if (result.meta.changes === 0) {
        const existing = await this.db
          .prepare(
            `SELECT name, address, map_url, reason, recommendation, visitor_hash
             FROM suggestions
             WHERE id = ?
             LIMIT 1`,
          )
          .bind(suggestion.id)
          .first<{
            name: string;
            address: string | null;
            map_url: string | null;
            reason: string;
            recommendation: string | null;
            visitor_hash: string;
          }>();
        if (!existing) {
          throw new Error("A conflicting suggestion row could not be read.");
        }
        if (
          existing.name !== suggestion.name ||
          existing.address !== (suggestion.address ?? null) ||
          existing.map_url !== (suggestion.mapUrl ?? null) ||
          existing.reason !== suggestion.reason ||
          existing.recommendation !== (suggestion.recommendation ?? null) ||
          existing.visitor_hash !== suggestion.visitorHash
        ) {
          throw new SuggestionReplayConflictError();
        }
      }
      return { id: suggestion.id, status: "pending" };
    } catch (error) {
      return communityFailure(error);
    }
  }

  async consumeRateLimit(attempt: RateLimitAttempt): Promise<RateLimitResult> {
    try {
      await this.db
        .prepare("DELETE FROM rate_limits WHERE expires_at <= ?")
        .bind(attempt.now)
        .run();
      const row = await this.db
        .prepare(
          `INSERT INTO rate_limits
            (key_hash, action, bucket, count, expires_at)
           VALUES (?, ?, ?, 1, ?)
           ON CONFLICT(key_hash, action, bucket) DO UPDATE SET
             count = rate_limits.count + 1,
             expires_at = excluded.expires_at
           RETURNING count`,
        )
        .bind(
          attempt.keyHash,
          attempt.action,
          attempt.bucket,
          attempt.expiresAt,
        )
        .first<{ count: number }>();
      if (!row) {
        throw new Error("D1 rate-limit upsert returned no count.");
      }
      return {
        allowed: row.count <= attempt.limit,
        count: row.count,
        retryAfterSeconds: Math.max(1, attempt.expiresAt - attempt.now),
      };
    } catch (error) {
      return communityFailure(error);
    }
  }
}
