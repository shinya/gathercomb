-- Gathercomb Database Schema
-- PostgreSQL initialization script

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,         -- uuid
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- bcrypt
  display_name  TEXT NOT NULL,
  created_at    BIGINT NOT NULL           -- Unix timestamp in milliseconds
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id           TEXT PRIMARY KEY,          -- uuid
  title        TEXT NOT NULL,
  owner_id     TEXT NOT NULL REFERENCES users(id),
  created_at   BIGINT NOT NULL,            -- Unix timestamp in milliseconds
  updated_at   BIGINT NOT NULL             -- Unix timestamp in milliseconds
);

-- Memberships (board-level RBAC)
CREATE TABLE IF NOT EXISTS memberships (
  user_id  TEXT NOT NULL REFERENCES users(id),
  board_id TEXT NOT NULL REFERENCES boards(id),
  role     TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
  PRIMARY KEY (user_id, board_id)
);

-- y_events: Yjs incremental updates (binary)
CREATE TABLE IF NOT EXISTS y_events (
  id         SERIAL PRIMARY KEY,
  board_id   TEXT NOT NULL REFERENCES boards(id),
  actor_id   TEXT NOT NULL REFERENCES users(id),
  ts         BIGINT NOT NULL,              -- Unix timestamp in milliseconds
  update_bin BYTEA NOT NULL                -- Yjs update (Uint8Array)
);

-- y_snapshots: periodic snapshot of Y.Doc
CREATE TABLE IF NOT EXISTS y_snapshots (
  id         SERIAL PRIMARY KEY,
  board_id   TEXT NOT NULL REFERENCES boards(id),
  ts         BIGINT NOT NULL,              -- Unix timestamp in milliseconds
  state_bin  BYTEA NOT NULL               -- Yjs encodeStateAsUpdate doc
);

-- audit_light: optional, human-readable summary for "誰が何を"（後で活用）
CREATE TABLE IF NOT EXISTS audit_light (
  id         SERIAL PRIMARY KEY,
  board_id   TEXT NOT NULL,
  actor_id   TEXT NOT NULL,
  ts         BIGINT NOT NULL,              -- Unix timestamp in milliseconds
  action     TEXT NOT NULL,                -- 'create_note' | 'update_note' | ...
  note_id    TEXT,                         -- CRDT上のキー（存在すれば）
  payload    TEXT                          -- JSON (delta summary)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_y_events_board_id ON y_events(board_id);
CREATE INDEX IF NOT EXISTS idx_y_events_ts ON y_events(ts);
CREATE INDEX IF NOT EXISTS idx_y_snapshots_board_id ON y_snapshots(board_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_board_id ON memberships(board_id);
CREATE INDEX IF NOT EXISTS idx_audit_light_board_id ON audit_light(board_id);
CREATE INDEX IF NOT EXISTS idx_audit_light_actor_id ON audit_light(actor_id);
