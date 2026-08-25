'use strict';

const express = require('express');
const path = require('node:path');
const { syncMission } = require('../github/sync');
const { listArtifactFiles, readArtifactFile } = require('../github/artifactFiles');
const { MISSION_STATES } = require('../domain/states');

function notFound(res, what) {
  res.status(404).json({ error: `${what} introuvable` });
}

// Builds the Express app. `github` and `owner`/`repoName` are optional so
// the API stays fully testable without network access — routes that need
// GitHub simply return 503 with an explicit message instead of crashing.
function createApp({ orchestrationRepo, github = null, owner = null, repoName = null, staticDir = null } = {}) {
  const app = express();
  app.use(express.json());

  // Section 32/37: never echo secrets. This endpoint reports reachability
  // only, never token values, and reports DB/GitHub failures explicitly
  // instead of pretending everything is fine.
  app.get('/health', async (req, res) => {
    const health = { database: 'OK', github: 'NOT_VERIFIED' };
    try {
      orchestrationRepo.listProjects();
    } catch (err) {
      health.database = `ERROR: ${err.message}`;
    }
    if (github && owner && repoName) {
      try {
        await github.getRepo(owner, repoName);
        health.github = 'OK';
      } catch (err) {
        health.github = `ERROR: ${err.status || ''} ${err.message}`.trim();
      }
    } else {
      health.github = 'NOT_CONFIGURED';
    }
    res.json(health);
  });

  // --- projects ---------------------------------------------------------
  app.get('/projects', (req, res) => {
    res.json(orchestrationRepo.listProjects());
  });

  app.post('/projects', (req, res) => {
    const { name, repository, defaultBranch } = req.body || {};
    if (!name || !repository || !defaultBranch) {
      return res.status(400).json({ error: 'name, repository et defaultBranch sont requis' });
    }
    res.status(201).json(orchestrationRepo.upsertProject({ name, repository, defaultBranch }));
  });

  app.get('/projects/:id', (req, res) => {
    const project = orchestrationRepo.getProject(Number(req.params.id));
    if (!project) return notFound(res, 'Projet');
    res.json(project);
  });

  // --- missions ----------------------------------------------------------
  app.get('/missions', (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    res.json(orchestrationRepo.listMissions({ projectId }));
  });

  app.post('/missions', (req, res) => {
    const { missionKey, projectId, lot, objective, prNumber, maxCycles, humanApprovalBeforeProduction } = req.body || {};
    if (!missionKey || !projectId || !lot || !objective) {
      return res.status(400).json({ error: 'missionKey, projectId, lot et objective sont requis' });
    }
    if (!orchestrationRepo.getProject(Number(projectId))) {
      return res.status(400).json({ error: 'projectId inconnu' });
    }
    const mission = orchestrationRepo.createMission({
      missionKey,
      projectId: Number(projectId),
      lot,
      objective,
      prNumber: prNumber ?? null,
      maxCycles: maxCycles ?? 2,
      humanApprovalBeforeProduction: humanApprovalBeforeProduction ?? true,
    });
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      type: 'MISSION_CREATED',
      actor: 'Patrick',
      message: `Mission ${mission.mission_key} créée pour le lot ${mission.lot}`,
      timestamp: new Date().toISOString(),
      payload: { objective },
      source: 'cockpit',
    });
    res.status(201).json(mission);
  });

  app.get('/missions/:id', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(mission);
  });

  async function runSync(mission, res) {
    if (!github || !owner || !repoName) {
      res.status(503).json({ error: 'Connexion GitHub non configurée (GITHUB_TOKEN manquant)' });
      return;
    }
    try {
      const result = await syncMission({ github, orchestrationRepo, owner, repoName, mission });
      res.json(result);
    } catch (err) {
      res.status(502).json({ error: `Synchronisation GitHub impossible: ${err.message}` });
    }
  }

  app.post('/missions/:id/sync', async (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    await runSync(mission, res);
  });

  // "start" (section 36) hands the mission over to the GitHub-driven
  // orchestration: the cockpit does not itself call Claude/ChatGPT, it
  // marks the mission ready and immediately pulls the current GitHub
  // state so the dashboard reflects reality rather than an assumption.
  app.post('/missions/:id/start', async (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    if (mission.status === 'IDLE') orchestrationRepo.updateMissionStatus(mission.id, 'MISSION_READY');
    await runSync(orchestrationRepo.getMission(mission.id), res);
  });

  app.post('/missions/:id/pause', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(orchestrationRepo.pauseMission(mission.id));
  });

  app.post('/missions/:id/resume', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(orchestrationRepo.resumeMission(mission.id));
  });

  app.get('/missions/:id/events', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(orchestrationRepo.listEvents(mission.id));
  });

  app.get('/missions/:id/runs', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(orchestrationRepo.listRuns(mission.id));
  });

  app.get('/missions/:id/approvals', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    res.json(orchestrationRepo.listApprovals(mission.id));
  });

  // Combined view the dashboard polls: mission + latest run + review +
  // findings + events in one round trip (section 21: polling every 5-15s
  // must stay cheap).
  app.get('/missions/:id/cockpit', (req, res) => {
    const mission = orchestrationRepo.getMission(Number(req.params.id));
    if (!mission) return notFound(res, 'Mission');
    const runs = orchestrationRepo.listRuns(mission.id);
    const latestRun = runs[runs.length - 1] || null;
    const review = latestRun ? orchestrationRepo.getReviewForRun(latestRun.id) : null;
    const findings = review ? orchestrationRepo.listFindingsForReview(review.id) : [];
    res.json({
      mission,
      project: orchestrationRepo.getProject(mission.project_id),
      runs,
      latestRun,
      review,
      findings,
      events: orchestrationRepo.listEvents(mission.id),
      approvals: orchestrationRepo.listApprovals(mission.id),
      states: MISSION_STATES,
    });
  });

  // --- runs ----------------------------------------------------------------
  app.get('/runs/:id', (req, res) => {
    const run = orchestrationRepo.getRun(Number(req.params.id));
    if (!run) return notFound(res, 'Run');
    res.json(run);
  });

  app.get('/runs/:id/review', (req, res) => {
    const run = orchestrationRepo.getRun(Number(req.params.id));
    if (!run) return notFound(res, 'Run');
    res.json(orchestrationRepo.getReviewForRun(run.id));
  });

  app.get('/runs/:id/findings', (req, res) => {
    const run = orchestrationRepo.getRun(Number(req.params.id));
    if (!run) return notFound(res, 'Run');
    const review = orchestrationRepo.getReviewForRun(run.id);
    res.json(review ? orchestrationRepo.listFindingsForReview(review.id) : []);
  });

  // --- artifacts / visual evidence (section 17) --------------------------
  // GitHub is the source of truth for build/test artifacts — the cockpit
  // never copies them into its own database, only proxies them through so
  // the frontend never needs a GitHub token of its own.
  function requireGithubRun(req, res) {
    const run = orchestrationRepo.getRun(Number(req.params.id));
    if (!run) {
      notFound(res, 'Run');
      return null;
    }
    if (!run.workflow_run_id) {
      res.json([]);
      return null;
    }
    if (!github || !owner || !repoName) {
      res.status(503).json({ error: 'Connexion GitHub non configurée (GITHUB_TOKEN manquant)' });
      return null;
    }
    return run;
  }

  app.get('/runs/:id/artifacts', async (req, res) => {
    const run = requireGithubRun(req, res);
    if (!run) return;
    try {
      const data = await github.listArtifactsForWorkflowRun(owner, repoName, run.workflow_run_id);
      res.json(data.artifacts || []);
    } catch (err) {
      res.status(502).json({ error: `Lecture des artifacts impossible: ${err.message}` });
    }
  });

  app.get('/runs/:id/artifacts/:artifactId/files', async (req, res) => {
    const run = requireGithubRun(req, res);
    if (!run) return;
    try {
      const files = await listArtifactFiles(github, owner, repoName, req.params.artifactId);
      res.json(files);
    } catch (err) {
      res.status(502).json({ error: `Lecture de l'artifact impossible: ${err.message}` });
    }
  });

  app.get('/runs/:id/artifacts/:artifactId/files/*', async (req, res) => {
    const run = requireGithubRun(req, res);
    if (!run) return;
    const filePath = req.params[0];
    try {
      const file = await readArtifactFile(github, owner, repoName, req.params.artifactId, filePath);
      if (!file) return notFound(res, 'Fichier');
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.send(file.data);
    } catch (err) {
      res.status(502).json({ error: `Lecture du fichier impossible: ${err.message}` });
    }
  });

  // --- approvals (section 15: arbitrage humain) -----------------------
  app.post('/approvals/:id/decision', (req, res) => {
    const approval = orchestrationRepo.getApproval(Number(req.params.id));
    if (!approval) return notFound(res, 'Demande d’arbitrage');
    const { decision, decidedBy } = req.body || {};
    const ALLOWED = ['GRANTED', 'REFUSED', 'CHANGES_REQUESTED'];
    if (!ALLOWED.includes(decision)) {
      return res.status(400).json({ error: `decision doit être l'une de: ${ALLOWED.join(', ')}` });
    }
    if (!decidedBy) {
      return res.status(400).json({ error: 'decidedBy est requis (traçabilité section 42)' });
    }
    const updated = orchestrationRepo.decideApproval(approval.id, { status: decision, decidedBy, decision });
    orchestrationRepo.recordEvent({
      missionId: approval.mission_id,
      type: 'HUMAN_DECISION',
      actor: decidedBy,
      message: `Décision humaine: ${decision} sur la demande #${approval.id}`,
      timestamp: new Date().toISOString(),
      payload: { approvalId: approval.id, decision },
      source: 'cockpit',
    });
    res.json(updated);
  });

  // --- GitHub status (section 22) ---------------------------------------
  app.get('/github/status', (req, res) => {
    res.json({ configured: Boolean(github && owner && repoName), owner, repository: repoName });
  });

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('/', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  return app;
}

module.exports = { createApp };
