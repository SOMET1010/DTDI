'use strict';

// The sync engine: turns GitHub facts (PR state, workflow runs, jobs,
// PR comments) into the orchestration model (runs/events/reviews/
// findings/mission status). This is the one place where "VISIBLE =
// PROUVÉ" (section 4) is enforced — every mission status change must be
// traceable to a specific GitHub fact recorded as an event.

const { parseReviewComment, parseRunId } = require('./parseReview');
const { nextMissionStatus } = require('../domain/states');

const STEP_STATE_HINTS = [
  [/claude corrects/i, 'CLAUDE_CORRECTING'],
  [/independent chatgpt review/i, 'REVIEWING'],
  [/publish review/i, 'REVIEWING'],
  [/content structure tests/i, 'TESTING'],
  [/android debug build/i, 'TESTING'],
];

function stateHintFromJobs(jobsResponse) {
  const jobs = jobsResponse?.jobs || [];
  for (const job of jobs) {
    for (const step of job.steps || []) {
      if (step.status !== 'in_progress') continue;
      const hint = STEP_STATE_HINTS.find(([re]) => re.test(step.name));
      if (hint) return hint[1];
    }
  }
  return null;
}

function findReviewCommentForHeadSha(comments, headSha) {
  for (const comment of comments) {
    const parsed = parseReviewComment(comment.body);
    if (!parsed) continue;
    const runId = parseRunId(parsed.runId);
    if (runId && headSha && headSha.startsWith(runId.headShaPrefix)) {
      return { comment, parsed };
    }
  }
  return null;
}

// Ensures a run row exists for the PR's current head SHA, creating a new
// cycle when the head SHA changed since the last known run (a new push
// — e.g. a correction — always means a new cycle, never overwrites the
// previous one: history is never erased, section 24).
function ensureRunForHeadSha(orchestrationRepo, mission, pr) {
  const runs = orchestrationRepo.listRuns(mission.id);
  const latest = runs[runs.length - 1];
  if (latest && latest.head_sha === pr.head.sha) {
    return { run: latest, isNewCycle: false };
  }
  const cycle = (latest?.cycle || 0) + 1;
  const run = orchestrationRepo.upsertRun({
    missionId: mission.id,
    cycle,
    branch: pr.head.ref,
    baseSha: pr.base.sha,
    headSha: pr.head.sha,
    status: 'NOT_VERIFIED',
  });
  orchestrationRepo.setMissionCycle(mission.id, cycle);
  return { run, isNewCycle: true };
}

async function syncMission({ github, orchestrationRepo, owner, repoName, mission }) {
  if (!mission.pr_number) {
    return { mission, status: mission.status };
  }

  const pr = await github.getPullRequest(owner, repoName, mission.pr_number);

  const { run, isNewCycle } = ensureRunForHeadSha(orchestrationRepo, mission, pr);
  if (isNewCycle) {
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      runId: run.id,
      type: 'COMMIT_PUSHED',
      actor: 'GitHub',
      message: `Commit ${pr.head.sha.slice(0, 12)} poussé sur ${pr.head.ref} (cycle ${run.cycle})`,
      timestamp: pr.updated_at || new Date().toISOString(),
      payload: { headSha: pr.head.sha, baseSha: pr.base.sha, branch: pr.head.ref },
      source: 'github',
      dedupeKey: `commit-${mission.id}-${pr.head.sha}`,
    });
  }

  const runsForCommit = await github.listWorkflowRunsForCommit(owner, repoName, pr.head.sha);
  const workflowRun = (runsForCommit?.workflow_runs || []).find((r) => r.name === 'PASS AI Review') || runsForCommit?.workflow_runs?.[0];

  if (!workflowRun) {
    const status = run.cycle > 1 ? 'CLAUDE_CORRECTING' : 'MISSION_READY';
    orchestrationRepo.updateMissionStatus(mission.id, status);
    return { mission: orchestrationRepo.getMission(mission.id), status };
  }

  orchestrationRepo.upsertRun({
    missionId: mission.id,
    cycle: run.cycle,
    workflowRunId: workflowRun.id,
  });

  if (workflowRun.status !== 'completed') {
    const jobs = await github.listJobsForWorkflowRun(owner, repoName, workflowRun.id);
    const hint = stateHintFromJobs(jobs) || 'TESTING';
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      runId: run.id,
      type: 'WORKFLOW_IN_PROGRESS',
      actor: 'GitHub Actions',
      message: `Workflow "PASS AI Review" en cours (${hint})`,
      timestamp: new Date().toISOString(),
      payload: { workflowRunId: workflowRun.id, status: workflowRun.status },
      source: 'github',
      dedupeKey: `wf-progress-${workflowRun.id}-${hint}`,
    });
    orchestrationRepo.updateMissionStatus(mission.id, hint);
    return { mission: orchestrationRepo.getMission(mission.id), status: hint };
  }

  // Workflow completed: look for the independent review comment matching
  // this exact head SHA before claiming anything about the outcome.
  const comments = await github.listIssueComments(owner, repoName, mission.pr_number);
  const found = findReviewCommentForHeadSha(comments, pr.head.sha);

  if (!found) {
    // No proof of a review for this commit. Doctrine: never invent a
    // success. Distinguish a technical orchestration failure (section
    // 38) from "review not posted yet".
    const status = workflowRun.conclusion === 'failure' ? 'FAILED' : 'NOT_VERIFIED';
    orchestrationRepo.updateRunStatus(run.id, status);
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      runId: run.id,
      type: status === 'FAILED' ? 'ORCHESTRATION_FAILURE' : 'NO_REVIEW_EVIDENCE',
      actor: 'Cockpit',
      message:
        status === 'FAILED'
          ? 'Le workflow a échoué avant de produire une revue ChatGPT QA — panne d’orchestration, pas un NOK produit.'
          : 'Aucune preuve de revue ChatGPT QA pour ce commit.',
      timestamp: new Date().toISOString(),
      payload: { workflowRunId: workflowRun.id, conclusion: workflowRun.conclusion },
      source: 'cockpit',
      dedupeKey: `no-review-${workflowRun.id}`,
    });
    orchestrationRepo.updateMissionStatus(mission.id, status);
    return { mission: orchestrationRepo.getMission(mission.id), status };
  }

  const { comment, parsed } = found;
  let review = orchestrationRepo.getReviewForRun(run.id);
  if (!review || review.verdict !== parsed.verdict) {
    review = orchestrationRepo.createReview({
      runId: run.id,
      verdict: parsed.verdict,
      nextAction: parsed.nextAction,
      summary: parsed.summary,
      notVerified: parsed.notVerified,
    });
    for (const f of parsed.findings) {
      orchestrationRepo.createFinding({
        reviewId: review.id,
        findingKey: f.id,
        severity: f.severity,
        status: f.status,
        finding: f.finding,
        location: f.location,
        evidence: f.evidence,
        requiredFix: f.required_fix,
        mustPreserve: f.must_preserve,
        revalidation: f.revalidation,
      });
    }
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      runId: run.id,
      type: 'REVIEW_VERDICT',
      actor: 'ChatGPT QA',
      message: `Verdict ${parsed.verdict}${parsed.findings.length ? ` — ${parsed.findings.length} anomalie(s)` : ''}`,
      timestamp: comment.created_at,
      payload: { verdict: parsed.verdict, nextAction: parsed.nextAction, findings: parsed.findings.length },
      source: 'github',
      dedupeKey: `review-${comment.id}`,
    });
  }

  orchestrationRepo.updateRunStatus(run.id, parsed.verdict);

  const status = nextMissionStatus({
    verdict: parsed.verdict,
    nextAction: parsed.nextAction,
    currentCycle: run.cycle,
    maxCycles: mission.max_cycles,
  });

  if (status === 'HUMAN_ARBITRATION') {
    orchestrationRepo.requestApproval({
      missionId: mission.id,
      type: 'human_arbitration',
      reason: parsed.summary || 'Escalade automatique après cycles de correction épuisés.',
    });
    orchestrationRepo.recordEvent({
      missionId: mission.id,
      runId: run.id,
      type: 'HUMAN_ARBITRATION_REQUIRED',
      actor: 'Cockpit',
      message: 'Intervention de Patrick requise.',
      timestamp: new Date().toISOString(),
      payload: { cycle: run.cycle, maxCycles: mission.max_cycles },
      source: 'cockpit',
      dedupeKey: `arbitration-${mission.id}-${run.cycle}`,
    });
  }

  orchestrationRepo.updateMissionStatus(mission.id, status);
  return { mission: orchestrationRepo.getMission(mission.id), status };
}

module.exports = { syncMission, stateHintFromJobs, findReviewCommentForHeadSha, ensureRunForHeadSha };
