'use strict';

// Entry point. Reads configuration from the environment only — nothing
// here is ever exposed to the frontend (section 32). Missing secrets
// degrade the cockpit to a read-only, GitHub-disconnected mode instead
// of crashing, so the dashboard itself stays inspectable.

const path = require('node:path');
const { openDatabase } = require('./db/client');
const { createRepository } = require('./db/repository');
const { createGithubClient } = require('./github/client');
const { syncMission } = require('./github/sync');
const { createApp } = require('./api/server');

const PORT = Number(process.env.PORT || 4000);
const DB_PATH = process.env.COCKPIT_DB_PATH || path.join(__dirname, '..', 'data', 'cockpit.sqlite');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || '';
const GITHUB_REPO = process.env.GITHUB_REPO || '';
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'pass-academy-v03';
const POLL_INTERVAL_MS = Number(process.env.COCKPIT_POLL_INTERVAL_MS || 10000);
const STATIC_DIR = path.join(__dirname, '..', 'public');

function ensureDataDir(dbPath) {
  const fs = require('node:fs');
  const dir = path.dirname(dbPath);
  if (dbPath !== ':memory:' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  ensureDataDir(DB_PATH);
  const db = openDatabase(DB_PATH);
  const orchestrationRepo = createRepository(db);

  const github = GITHUB_TOKEN ? createGithubClient({ token: GITHUB_TOKEN }) : null;

  if (GITHUB_OWNER && GITHUB_REPO) {
    orchestrationRepo.upsertProject({
      name: 'PASS Academy',
      repository: `${GITHUB_OWNER}/${GITHUB_REPO}`,
      defaultBranch: DEFAULT_BRANCH,
    });
  }

  const app = createApp({
    orchestrationRepo,
    github,
    owner: GITHUB_OWNER || null,
    repoName: GITHUB_REPO || null,
    staticDir: STATIC_DIR,
  });

  const server = app.listen(PORT, () => {
    console.log(`PASS AI Orchestrator Cockpit listening on :${PORT}`);
    console.log(`GitHub connection: ${github ? 'configured' : 'NOT_CONFIGURED (set GITHUB_TOKEN)'}`);
  });

  let polling = false;
  const interval = github && GITHUB_OWNER && GITHUB_REPO
    ? setInterval(async () => {
        if (polling) return;
        polling = true;
        try {
          const missions = orchestrationRepo.listActiveMissions();
          for (const mission of missions) {
            await syncMission({ github, orchestrationRepo, owner: GITHUB_OWNER, repoName: GITHUB_REPO, mission });
          }
        } catch (err) {
          console.error('Background sync failed:', err.message);
        } finally {
          polling = false;
        }
      }, POLL_INTERVAL_MS)
    : null;

  function shutdown() {
    if (interval) clearInterval(interval);
    server.close(() => {
      db.close();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { app, server, db, orchestrationRepo };
}

if (require.main === module) {
  main();
}

module.exports = { main };
