PRAGMA foreign_keys = ON;

CREATE TABLE neighborhoods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 100),
  name TEXT NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 120)
);

CREATE TABLE moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 80),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100)
);

CREATE TABLE offerings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 80),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100)
);

CREATE TABLE cafes (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 120),
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 120),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  branch TEXT,
  address TEXT NOT NULL CHECK (length(address) BETWEEN 1 AND 240),
  address_verified INTEGER NOT NULL DEFAULT 0 CHECK (address_verified IN (0, 1)),
  neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  coordinate_confidence TEXT NOT NULL CHECK (coordinate_confidence IN ('poi', 'address')),
  branch_specificity TEXT NOT NULL CHECK (
    branch_specificity IN ('explicit', 'expanded-from-unspecified', 'inferred-toronto-scope', 'inferred-from-named-sibling')
  ),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'branch-unspecified')),
  attributes_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(attributes_json)),
  recommendation TEXT NOT NULL CHECK (length(recommendation) BETWEEN 1 AND 1000),
  source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
  maps_url TEXT NOT NULL CHECK (maps_url LIKE 'https://%'),
  verified_at TEXT NOT NULL CHECK (verified_at GLOB '????-??-??'),
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cafe_moods (
  cafe_id TEXT NOT NULL REFERENCES cafes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  mood_id INTEGER NOT NULL REFERENCES moods(id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (cafe_id, mood_id)
);

CREATE TABLE cafe_offerings (
  cafe_id TEXT NOT NULL REFERENCES cafes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  offering_id INTEGER NOT NULL REFERENCES offerings(id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (cafe_id, offering_id)
);

CREATE TABLE suggestions (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 120),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  address TEXT NOT NULL CHECK (length(address) BETWEEN 5 AND 240),
  map_url TEXT CHECK (map_url IS NULL OR map_url LIKE 'https://%'),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 1000),
  recommendation TEXT CHECK (recommendation IS NULL OR length(recommendation) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  visitor_hash TEXT NOT NULL CHECK (length(visitor_hash) = 64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  CHECK (status = 'pending' OR reviewed_at IS NOT NULL)
);

CREATE TABLE reactions (
  cafe_id TEXT NOT NULL REFERENCES cafes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL CHECK (length(visitor_hash) = 64),
  kind TEXT NOT NULL CHECK (
    kind IN ('cozy', 'quiet', 'work-friendly', 'date-friendly', 'late-night', 'great-coffee', 'great-tea')
  ),
  id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cafe_id, visitor_hash, kind)
);

CREATE INDEX idx_cafes_published_neighborhood
  ON cafes(published, neighborhood_id);
CREATE INDEX idx_cafe_moods_mood
  ON cafe_moods(mood_id, cafe_id);
CREATE INDEX idx_cafe_offerings_offering
  ON cafe_offerings(offering_id, cafe_id);
CREATE INDEX idx_reactions_cafe_kind
  ON reactions(cafe_id, kind);
CREATE INDEX idx_suggestions_status_created
  ON suggestions(status, created_at);
