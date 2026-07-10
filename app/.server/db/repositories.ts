import type { Cafe } from "../../contracts/cafes";

export type SuggestionRecord = Readonly<{
  name: string;
  address: string;
  mapUrl?: string;
  reason: string;
  recommendation?: string;
  visitorHash: string;
}>;

export type PendingSuggestion = Readonly<{
  id: string;
  status: "pending";
}>;

export interface CatalogueRepository {
  list(): Promise<readonly Cafe[]>;
  findBySlug(slug: string): Promise<Cafe | null>;
}

export class CatalogueRepositoryUnavailableError extends Error {
  override readonly name = "CatalogueRepositoryUnavailableError";
}

export interface CommunityRepository {
  addReaction(
    cafeId: string,
    visitorHash: string,
    kind: string,
  ): Promise<boolean>;
  removeReaction(
    cafeId: string,
    visitorHash: string,
    kind: string,
  ): Promise<boolean>;
  createSuggestion(suggestion: SuggestionRecord): Promise<PendingSuggestion>;
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
    const result = await this.db
      .prepare(`${CAFE_SELECT} WHERE c.published = 1 ORDER BY c.name, c.branch`)
      .all<CafeRow>();
    return result.results.map(mapCafeRow);
  }

  async findBySlug(slug: string): Promise<Cafe | null> {
    const row = await this.db
      .prepare(`${CAFE_SELECT} WHERE c.slug = ? AND c.published = 1 LIMIT 1`)
      .bind(slug)
      .first<CafeRow>();
    return row ? mapCafeRow(row) : null;
  }
}

export class D1CommunityRepository implements CommunityRepository {
  constructor(private readonly db: D1Database) {}

  async addReaction(
    cafeId: string,
    visitorHash: string,
    kind: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO reactions (id, cafe_id, visitor_hash, kind)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cafe_id, visitor_hash, kind) DO NOTHING`,
      )
      .bind(crypto.randomUUID(), cafeId, visitorHash, kind)
      .run();
    return result.meta.changes > 0;
  }

  async removeReaction(
    cafeId: string,
    visitorHash: string,
    kind: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM reactions
         WHERE cafe_id = ? AND visitor_hash = ? AND kind = ?`,
      )
      .bind(cafeId, visitorHash, kind)
      .run();
    return result.meta.changes > 0;
  }

  async createSuggestion(
    suggestion: SuggestionRecord,
  ): Promise<PendingSuggestion> {
    const id = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO suggestions
          (id, name, address, map_url, reason, recommendation, visitor_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        suggestion.name,
        suggestion.address,
        suggestion.mapUrl ?? null,
        suggestion.reason,
        suggestion.recommendation ?? null,
        suggestion.visitorHash,
      )
      .run();
    return { id, status: "pending" };
  }
}
