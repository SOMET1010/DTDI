'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/client');
const { createRepository } = require('../src/db/repository');

function freshRepo() {
  return createRepository(openDatabase(':memory:'));
}

test('upsertProject creates then updates in place by repository key', () => {
  const repo = freshRepo();
  const created = repo.upsertProject({ name: 'PASS Academy', repository: 'SOMET1010/DTDI', defaultBranch: 'main' });
  assert.equal(repo.listProjects().length, 1);
  const updated = repo.upsertProject({ name: 'PASS Academy v2', repository: 'SOMET1010/DTDI', defaultBranch: 'pass-academy-v03' });
  assert.equal(updated.id, created.id);
  assert.equal(updated.name, 'PASS Academy v2');
  assert.equal(repo.listProjects().length, 1);
});

test('createMission defaults max_cycles to 2 and current_cycle to 0', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  assert.equal(mission.max_cycles, 2);
  assert.equal(mission.current_cycle, 0);
  assert.equal(mission.status, 'IDLE');
});

test('runs are never overwritten across cycles — history section 24', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  repo.upsertRun({ missionId: mission.id, cycle: 1, headSha: 'sha1', status: 'NOK' });
  repo.upsertRun({ missionId: mission.id, cycle: 2, headSha: 'sha2', status: 'GO' });
  const runs = repo.listRuns(mission.id);
  assert.equal(runs.length, 2);
  assert.equal(runs[0].head_sha, 'sha1');
  assert.equal(runs[1].head_sha, 'sha2');
});

test('recordEvent is idempotent when given the same dedupeKey', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  repo.recordEvent({ missionId: mission.id, type: 'X', actor: 'a', message: 'm1', timestamp: 't1', source: 'github', dedupeKey: 'k1' });
  repo.recordEvent({ missionId: mission.id, type: 'X', actor: 'a', message: 'm1 duplicate attempt', timestamp: 't1', source: 'github', dedupeKey: 'k1' });
  const events = repo.listEvents(mission.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].message, 'm1');
});

test('findings round-trip their array fields as JSON', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  const run = repo.upsertRun({ missionId: mission.id, cycle: 1, headSha: 'sha1', status: 'NOK' });
  const review = repo.createReview({ runId: run.id, verdict: 'NOK', nextAction: 'CORRECT_AND_RESUBMIT', summary: 's', notVerified: ['x'] });
  repo.createFinding({
    reviewId: review.id,
    findingKey: 'NOK-1',
    severity: 'MAJOR',
    status: 'FAIL',
    finding: 'f',
    location: 'loc',
    evidence: ['e1', 'e2'],
    requiredFix: 'fix',
    mustPreserve: ['inv1'],
    revalidation: ['re1'],
  });
  const findings = repo.listFindingsForReview(review.id);
  assert.equal(findings.length, 1);
  assert.deepEqual(findings[0].evidence, ['e1', 'e2']);
  assert.deepEqual(findings[0].must_preserve, ['inv1']);
  assert.deepEqual(findings[0].revalidation, ['re1']);
});

test('requestApproval does not duplicate a pending request of the same type', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  const a1 = repo.requestApproval({ missionId: mission.id, type: 'human_arbitration', reason: 'r1' });
  const a2 = repo.requestApproval({ missionId: mission.id, type: 'human_arbitration', reason: 'r2 (ignored)' });
  assert.equal(a1.id, a2.id);
  assert.equal(repo.listApprovals(mission.id).length, 1);
});

test('decideApproval records decidedBy and decision for the audit trail (section 42)', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj' });
  const approval = repo.requestApproval({ missionId: mission.id, type: 'human_arbitration' });
  const decided = repo.decideApproval(approval.id, { status: 'GRANTED', decidedBy: 'Patrick', decision: 'GRANTED' });
  assert.equal(decided.status, 'GRANTED');
  assert.equal(decided.decided_by, 'Patrick');
  assert.ok(decided.decided_at);
});

test('listActiveMissions excludes terminal statuses and paused missions', () => {
  const repo = freshRepo();
  const project = repo.upsertProject({ name: 'P', repository: 'o/r', defaultBranch: 'main' });
  const m1 = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1', objective: 'obj', prNumber: 1 });
  const m2 = repo.createMission({ missionKey: 'M-2', projectId: project.id, lot: 'C2', objective: 'obj', prNumber: 2 });
  const m3 = repo.createMission({ missionKey: 'M-3', projectId: project.id, lot: 'C3', objective: 'obj', prNumber: 3 });
  repo.updateMissionStatus(m1.id, 'CLAUDE_CORRECTING');
  repo.updateMissionStatus(m2.id, 'GO');
  repo.pauseMission(m3.id);

  const active = repo.listActiveMissions();
  assert.deepEqual(active.map((m) => m.id).sort(), [m1.id]);
});
