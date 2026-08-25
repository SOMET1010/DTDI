'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/client');
const { createRepository } = require('../src/db/repository');
const { createApp } = require('../src/api/server');

function startServer(opts = {}) {
  const repo = createRepository(openDatabase(':memory:'));
  const app = createApp({ orchestrationRepo: repo, ...opts });
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.on('listening', () => {
      const { port } = server.address();
      resolve({ repo, server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function stop(server) {
  await new Promise((resolve) => server.close(resolve));
}

test('GET /health never exposes secrets and reports NOT_CONFIGURED without a GitHub client', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.database, 'OK');
    assert.equal(body.github, 'NOT_CONFIGURED');
    assert.equal(JSON.stringify(body).includes('token'), false);
  } finally {
    await stop(server);
  }
});

test('POST /projects then POST /missions then GET /missions/:id/cockpit round-trips', async () => {
  const { server, base } = await startServer();
  try {
    let res = await fetch(`${base}/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'PASS Academy', repository: 'SOMET1010/DTDI', defaultBranch: 'pass-academy-v03' }),
    });
    assert.equal(res.status, 201);
    const project = await res.json();

    res = await fetch(`${base}/missions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ missionKey: 'M-1', projectId: project.id, lot: 'C1.3', objective: 'obj', prNumber: 1 }),
    });
    assert.equal(res.status, 201);
    const mission = await res.json();
    assert.equal(mission.status, 'IDLE');

    res = await fetch(`${base}/missions/${mission.id}/cockpit`);
    assert.equal(res.status, 200);
    const cockpit = await res.json();
    assert.equal(cockpit.mission.id, mission.id);
    assert.equal(cockpit.project.id, project.id);
    assert.equal(cockpit.events.length, 1, 'mission creation must be recorded as an event');
    assert.ok(Array.isArray(cockpit.states) && cockpit.states.includes('HUMAN_ARBITRATION'));
  } finally {
    await stop(server);
  }
});

test('POST /missions rejects a request missing required fields', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/missions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ missionKey: 'M-1' }),
    });
    assert.equal(res.status, 400);
  } finally {
    await stop(server);
  }
});

test('GET /missions/:id 404s with a clear error body for an unknown mission', async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/missions/999`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.match(body.error, /introuvable/);
  } finally {
    await stop(server);
  }
});

test('POST /missions/:id/sync returns 503 when GitHub is not configured (never silently fakes data)', async () => {
  const { repo, server, base } = await startServer();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj', prNumber: 1 });
  try {
    const res = await fetch(`${base}/missions/${mission.id}/sync`, { method: 'POST' });
    assert.equal(res.status, 503);
  } finally {
    await stop(server);
  }
});

test('POST /approvals/:id/decision validates the decision enum and requires decidedBy for the audit trail', async () => {
  const { repo, server, base } = await startServer();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  const approval = repo.requestApproval({ missionId: mission.id, type: 'human_arbitration' });
  try {
    let res = await fetch(`${base}/approvals/${approval.id}/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'NOT_A_REAL_DECISION', decidedBy: 'Patrick' }),
    });
    assert.equal(res.status, 400);

    res = await fetch(`${base}/approvals/${approval.id}/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'GRANTED' }),
    });
    assert.equal(res.status, 400);

    res = await fetch(`${base}/approvals/${approval.id}/decision`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'GRANTED', decidedBy: 'Patrick' }),
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.status, 'GRANTED');
    assert.equal(updated.decided_by, 'Patrick');
  } finally {
    await stop(server);
  }
});

test('POST /missions/:id/pause then /resume toggles paused_at', async () => {
  const { repo, server, base } = await startServer();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  try {
    let res = await fetch(`${base}/missions/${mission.id}/pause`, { method: 'POST' });
    let body = await res.json();
    assert.ok(body.paused_at);

    res = await fetch(`${base}/missions/${mission.id}/resume`, { method: 'POST' });
    body = await res.json();
    assert.equal(body.paused_at, null);
  } finally {
    await stop(server);
  }
});
