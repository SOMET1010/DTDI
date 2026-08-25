'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/client');
const { createRepository } = require('../src/db/repository');
const { syncMission } = require('../src/github/sync');

function setup({ maxCycles = 2 } = {}) {
  const repo = createRepository(openDatabase(':memory:'));
  const project = repo.upsertProject({ name: 'PASS Academy', repository: 'SOMET1010/DTDI', defaultBranch: 'pass-academy-v03' });
  const mission = repo.createMission({ missionKey: 'M-1', projectId: project.id, lot: 'C1.3', objective: 'obj', prNumber: 1, maxCycles });
  return { repo, project, mission };
}

function reviewComment({ prNumber = 1, headSha, verdict, action, findings = 1 }) {
  const lines = [
    `<!-- PASS-AI-REVIEW run=SOMET1010/DTDI#${prNumber}@${headSha.slice(0, 12)} -->`,
    `## ChatGPT QA — ${verdict}`,
    '',
    'résumé',
    '',
  ];
  for (let i = 0; i < findings; i++) {
    lines.push(
      `### NOK-${i} — MAJEURE — FAIL`,
      'desc',
      '**Localisation:** x',
      '**Preuves:** ',
      '**Correction demandée:** fix',
      '**À préserver:** ',
      '**Revalidation:** ',
      ''
    );
  }
  lines.push(`**Action:** ${action}`, '');
  return lines.join('\n');
}

function fakeGithub({ headSha, workflowRuns, jobs = { jobs: [] }, comments = [] }) {
  return {
    async getPullRequest() {
      return { number: 1, head: { sha: headSha, ref: 'branch' }, base: { sha: 'basesha1234' }, updated_at: '2026-01-01T00:00:00Z' };
    },
    async listWorkflowRunsForCommit() {
      return { workflow_runs: workflowRuns };
    },
    async listJobsForWorkflowRun() {
      return jobs;
    },
    async listIssueComments() {
      return comments;
    },
  };
}

test('syncMission: GO verdict moves the mission to GO and creates one run', async () => {
  const { repo, mission } = setup();
  const headSha = 'aaaa1111222233334444';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 1, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
    comments: [{ id: 1, created_at: '2026-01-01T00:05:00Z', body: reviewComment({ headSha, verdict: 'GO', action: 'PROCEED', findings: 0 }) }],
  });

  const { status, mission: updated } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });

  assert.equal(status, 'GO');
  assert.equal(updated.status, 'GO');
  assert.ok(updated.completed_at, 'GO must stamp completed_at');
  assert.equal(repo.listRuns(mission.id).length, 1);
});

test('syncMission: no workflow run yet keeps the mission at MISSION_READY without inventing evidence', async () => {
  const { repo, mission } = setup();
  const github = fakeGithub({ headSha: 'bbbb1111222233334444', workflowRuns: [] });
  const { status } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'MISSION_READY');
});

test('syncMission: workflow still running is surfaced as TESTING/REVIEWING, never a verdict', async () => {
  const { repo, mission } = setup();
  const headSha = 'cccc1111222233334444';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 2, name: 'PASS AI Review', status: 'in_progress', conclusion: null }],
    jobs: { jobs: [{ steps: [{ name: 'Independent ChatGPT review', status: 'in_progress' }] }] },
  });
  const { status } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'REVIEWING');
});

test('syncMission: completed workflow with no matching review comment is NOT_VERIFIED, not a silent GO', async () => {
  const { repo, mission } = setup();
  const headSha = 'dddd1111222233334444';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 3, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
    comments: [],
  });
  const { status } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'NOT_VERIFIED');
});

test('syncMission: a failed workflow with no review is an orchestration FAILURE, never a product NOK (section 38)', async () => {
  const { repo, mission } = setup();
  const headSha = 'eeee1111222233334444';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 4, name: 'PASS AI Review', status: 'completed', conclusion: 'failure' }],
    comments: [],
  });
  const { status } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'FAILED');
  const events = repo.listEvents(mission.id);
  assert.ok(events.some((e) => e.type === 'ORCHESTRATION_FAILURE'));
});

test('syncMission: NOK under the cycle cap requests a Claude correction', async () => {
  const { repo, mission } = setup({ maxCycles: 2 });
  const headSha = 'ffff1111222233334444';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 5, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
    comments: [{ id: 10, created_at: '2026-01-01T00:05:00Z', body: reviewComment({ headSha, verdict: 'NOK', action: 'CORRECT_AND_RESUBMIT' }) }],
  });
  const { status, mission: updated } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'CLAUDE_CORRECTING');
  assert.equal(updated.current_cycle, 1);
  assert.equal(repo.listApprovals(mission.id).length, 0);
});

test('syncMission: exhausting max_cycles on a fresh NOK escalates to HUMAN_ARBITRATION and records an approval request', async () => {
  let { repo, mission } = setup({ maxCycles: 2 });
  const shas = ['1111aaaa2222bbbb3333', '4444cccc5555dddd6666', '7777eeee8888ffff9999'];

  for (let cycle = 1; cycle <= 3; cycle++) {
    const headSha = shas[cycle - 1];
    const github = fakeGithub({
      headSha,
      workflowRuns: [{ id: 100 + cycle, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
      comments: [{ id: 200 + cycle, created_at: '2026-01-01T00:05:00Z', body: reviewComment({ headSha, verdict: 'NOK', action: 'CORRECT_AND_RESUBMIT' }) }],
    });
    const result = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
    mission = result.mission;
    if (cycle === 1) assert.equal(result.status, 'CLAUDE_CORRECTING');
    if (cycle >= 2) assert.equal(result.status, 'HUMAN_ARBITRATION');
  }

  assert.equal(mission.current_cycle, 3);
  const approvals = repo.listApprovals(mission.id);
  assert.equal(approvals.length, 1, 'no automatic Claude call may fire again once escalated — never a duplicate arbitration request per cycle count');
  assert.equal(approvals[0].status, 'PENDING');
});

test('syncMission: REQUEST_HUMAN_ARBITRATION escalates immediately regardless of cycle count', async () => {
  const { repo, mission } = setup({ maxCycles: 5 });
  const headSha = '0000aaaa1111bbbb2222';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 999, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
    comments: [{ id: 1, created_at: '2026-01-01T00:05:00Z', body: reviewComment({ headSha, verdict: 'BLOCKED', action: 'REQUEST_HUMAN_ARBITRATION' }) }],
  });
  const { status } = await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  assert.equal(status, 'HUMAN_ARBITRATION');
});

test('syncMission is idempotent: re-running against the same GitHub facts does not duplicate events, reviews or findings', async () => {
  const { repo, mission } = setup();
  const headSha = '1234abcd5678efab9012';
  const github = fakeGithub({
    headSha,
    workflowRuns: [{ id: 42, name: 'PASS AI Review', status: 'completed', conclusion: 'success' }],
    comments: [{ id: 77, created_at: '2026-01-01T00:05:00Z', body: reviewComment({ headSha, verdict: 'NOK', action: 'CORRECT_AND_RESUBMIT' }) }],
  });

  await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission });
  const afterFirst = {
    events: repo.listEvents(mission.id).length,
    runs: repo.listRuns(mission.id).length,
  };
  const run = repo.listRuns(mission.id)[0];
  const findingsAfterFirst = repo.listFindingsForReview(repo.getReviewForRun(run.id).id).length;

  const missionNow = repo.getMission(mission.id);
  await syncMission({ github, orchestrationRepo: repo, owner: 'SOMET1010', repoName: 'DTDI', mission: missionNow });

  assert.equal(repo.listEvents(mission.id).length, afterFirst.events);
  assert.equal(repo.listRuns(mission.id).length, afterFirst.runs);
  assert.equal(repo.listFindingsForReview(repo.getReviewForRun(run.id).id).length, findingsAfterFirst);
});
