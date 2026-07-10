CREATE TABLE suggestions_address_or_map (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 120),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  address TEXT CHECK (
    address IS NULL OR length(address) BETWEEN 5 AND 240
  ),
  map_url TEXT CHECK (
    map_url IS NULL OR map_url LIKE 'https://%'
  ),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 1000),
  recommendation TEXT CHECK (
    recommendation IS NULL OR length(recommendation) <= 500
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  visitor_hash TEXT NOT NULL CHECK (length(visitor_hash) = 64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  CHECK (address IS NOT NULL OR map_url IS NOT NULL),
  CHECK (status = 'pending' OR reviewed_at IS NOT NULL)
);

INSERT INTO suggestions_address_or_map
  (id, name, address, map_url, reason, recommendation, status,
   visitor_hash, created_at, reviewed_at)
SELECT
  id, name, address, map_url, reason, recommendation, status,
  visitor_hash, created_at, reviewed_at
FROM suggestions;

DROP TABLE suggestions;
ALTER TABLE suggestions_address_or_map RENAME TO suggestions;

CREATE INDEX idx_suggestions_status_created
  ON suggestions(status, created_at);
