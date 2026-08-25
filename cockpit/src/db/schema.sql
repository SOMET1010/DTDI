-- PASS AI Orchestrator Cockpit — orchestration data model (ORCH-1).
-- This database records ONLY the business state of the orchestration.
-- GitHub remains the source of truth for code; this schema never
-- duplicates repository content, only the facts needed to supervise it.

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  repository TEXT NOT NULL UNIQUE, -- "owner/repo"
  default_branch TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_key TEXT NOT NULL UNIQUE, -- e.g. "PASS-C1.3-001"
  project_id INTEGER NOT NULL REFERENCES projects(id),
  lot TEXT NOT NULL,
  objective TEXT NOT NULL,
  pr_number INTEGER,
  status TEXT NOT NULL DEFAULT 'IDLE',
  current_cycle INTEGER NOT NULL DEFAULT 0,
  max_cycles INTEGER NOT NULL DEFAULT 2,
  human_approval_before_production INTEGER NOT NULL DEFAULT 1,
  paused_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_missions_project ON missions(project_id);
CREATE INDEX IF NOT EXISTS idx_missions_pr ON missions(pr_number);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  cycle INTEGER NOT NULL,
  branch TEXT,
  base_sha TEXT,
  head_sha TEXT,
  status TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
  workflow_run_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (mission_id, cycle)
);

CREATE INDEX IF NOT EXISTS idx_runs_mission ON runs(mission_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  run_id INTEGER REFERENCES runs(id),
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  payload TEXT, -- JSON blob, raw evidence
  source TEXT NOT NULL, -- github | orchestrator | cockpit
  dedupe_key TEXT UNIQUE -- prevents re-inserting the same GitHub fact twice
);

CREATE INDEX IF NOT EXISTS idx_events_mission ON events(mission_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_run ON events(run_id);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES runs(id),
  reviewer TEXT NOT NULL DEFAULT 'ChatGPT QA',
  verdict TEXT NOT NULL,
  next_action TEXT,
  summary TEXT,
  not_verified TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_run ON reviews(run_id);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id),
  finding_key TEXT NOT NULL, -- e.g. "NOK-C13-004"
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  finding TEXT NOT NULL,
  location TEXT,
  evidence TEXT, -- JSON array
  required_fix TEXT,
  must_preserve TEXT, -- JSON array
  revalidation TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_findings_review ON findings(review_id);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  type TEXT NOT NULL, -- human_arbitration | production | scope_change
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | GRANTED | REFUSED | CHANGES_REQUESTED
  reason TEXT,
  requested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at TEXT,
  decided_by TEXT,
  decision TEXT
);

CREATE INDEX IF NOT EXISTS idx_approvals_mission ON approvals(mission_id);
