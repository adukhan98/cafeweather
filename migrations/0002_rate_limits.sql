PRAGMA foreign_keys = ON;

CREATE TABLE rate_limits (
  key_hash TEXT NOT NULL CHECK (length(key_hash) = 64),
  action TEXT NOT NULL CHECK (action IN ('reaction', 'suggestion')),
  bucket INTEGER NOT NULL CHECK (bucket >= 0),
  count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > 0),
  PRIMARY KEY (key_hash, action, bucket)
);

CREATE INDEX idx_rate_limits_expiry ON rate_limits(expires_at);
