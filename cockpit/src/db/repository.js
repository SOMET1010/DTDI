'use strict';

// Repository layer: every read/write to the orchestration model goes
// through here so the API and the sync engine share one source of truth
// for how rows are shaped.

function toJson(value) {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

function fromJson(value) {
  if (value === undefined || value === null) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function createRepository(db) {
  return {
    // --- projects ---------------------------------------------------
    upsertProject({ name, repository, defaultBranch }) {
      const existing = db.get('SELECT * FROM projects WHERE repository = :repository', { ':repository': repository });
      if (existing) {
        db.run('UPDATE projects SET name = :name, default_branch = :branch WHERE id = :id', {
          ':name': name,
          ':branch': defaultBranch,
          ':id': existing.id,
        });
        return this.getProject(existing.id);
      }
      db.run('INSERT INTO projects (name, repository, default_branch) VALUES (:name, :repository, :branch)', {
        ':name': name,
        ':repository': repository,
        ':branch': defaultBranch,
      });
      const row = db.get('SELECT * FROM projects WHERE repository = :repository', { ':repository': repository });
      return row;
    },
    listProjects() {
      return db.all('SELECT * FROM projects ORDER BY id ASC');
    },
    getProject(id) {
      return db.get('SELECT * FROM projects WHERE id = :id', { ':id': id });
    },

    // --- missions ----------------------------------------------------
    createMission({ missionKey, projectId, lot, objective, prNumber = null, maxCycles = 2, humanApprovalBeforeProduction = true }) {
      db.run(
        `INSERT INTO missions (mission_key, project_id, lot, objective, pr_number, max_cycles, human_approval_before_production)
         VALUES (:missionKey, :projectId, :lot, :objective, :prNumber, :maxCycles, :humanApproval)`,
        {
          ':missionKey': missionKey,
          ':projectId': projectId,
          ':lot': lot,
          ':objective': objective,
          ':prNumber': prNumber,
          ':maxCycles': maxCycles,
          ':humanApproval': humanApprovalBeforeProduction ? 1 : 0,
        }
      );
      return this.getMissionByKey(missionKey);
    },
    listMissions({ projectId } = {}) {
      if (projectId) {
        return db.all('SELECT * FROM missions WHERE project_id = :projectId ORDER BY id DESC', { ':projectId': projectId });
      }
      return db.all('SELECT * FROM missions ORDER BY id DESC');
    },
    getMission(id) {
      return db.get('SELECT * FROM missions WHERE id = :id', { ':id': id });
    },
    getMissionByKey(missionKey) {
      return db.get('SELECT * FROM missions WHERE mission_key = :missionKey', { ':missionKey': missionKey });
    },
    getMissionByPr({ projectId, prNumber }) {
      return db.get('SELECT * FROM missions WHERE project_id = :projectId AND pr_number = :prNumber', {
        ':projectId': projectId,
        ':prNumber': prNumber,
      });
    },
    updateMissionStatus(id, status) {
      const completedAt = ['GO'].includes(status) ? new Date().toISOString() : null;
      db.run('UPDATE missions SET status = :status, completed_at = COALESCE(:completedAt, completed_at) WHERE id = :id', {
        ':status': status,
        ':completedAt': completedAt,
        ':id': id,
      });
      return this.getMission(id);
    },
    setMissionCycle(id, cycle) {
      db.run('UPDATE missions SET current_cycle = :cycle WHERE id = :id', { ':cycle': cycle, ':id': id });
      return this.getMission(id);
    },
    linkMissionToPr(id, prNumber) {
      db.run('UPDATE missions SET pr_number = :prNumber WHERE id = :id', { ':prNumber': prNumber, ':id': id });
      return this.getMission(id);
    },
    pauseMission(id) {
      db.run('UPDATE missions SET paused_at = :now WHERE id = :id', { ':now': new Date().toISOString(), ':id': id });
      return this.getMission(id);
    },
    resumeMission(id) {
      db.run('UPDATE missions SET paused_at = NULL WHERE id = :id', { ':id': id });
      return this.getMission(id);
    },
    listActiveMissions() {
      return db.all("SELECT * FROM missions WHERE pr_number IS NOT NULL AND paused_at IS NULL AND status NOT IN ('GO', 'HUMAN_ARBITRATION', 'BLOCKED')");
    },

    // --- runs ----------------------------------------------------------
    upsertRun({ missionId, cycle, branch, baseSha, headSha, status, workflowRunId }) {
      const existing = db.get('SELECT * FROM runs WHERE mission_id = :missionId AND cycle = :cycle', {
        ':missionId': missionId,
        ':cycle': cycle,
      });
      if (existing) {
        db.run(
          `UPDATE runs SET branch = :branch, base_sha = :baseSha, head_sha = :headSha, status = :status, workflow_run_id = :workflowRunId
           WHERE id = :id`,
          {
            ':branch': branch ?? existing.branch,
            ':baseSha': baseSha ?? existing.base_sha,
            ':headSha': headSha ?? existing.head_sha,
            ':status': status ?? existing.status,
            ':workflowRunId': workflowRunId ?? existing.workflow_run_id,
            ':id': existing.id,
          }
        );
        return this.getRun(existing.id);
      }
      db.run(
        `INSERT INTO runs (mission_id, cycle, branch, base_sha, head_sha, status, workflow_run_id)
         VALUES (:missionId, :cycle, :branch, :baseSha, :headSha, :status, :workflowRunId)`,
        {
          ':missionId': missionId,
          ':cycle': cycle,
          ':branch': branch ?? null,
          ':baseSha': baseSha ?? null,
          ':headSha': headSha ?? null,
          ':status': status ?? 'NOT_VERIFIED',
          ':workflowRunId': workflowRunId ?? null,
        }
      );
      return db.get('SELECT * FROM runs WHERE mission_id = :missionId AND cycle = :cycle', {
        ':missionId': missionId,
        ':cycle': cycle,
      });
    },
    getRun(id) {
      return db.get('SELECT * FROM runs WHERE id = :id', { ':id': id });
    },
    listRuns(missionId) {
      return db.all('SELECT * FROM runs WHERE mission_id = :missionId ORDER BY cycle ASC', { ':missionId': missionId });
    },
    updateRunStatus(id, status) {
      db.run('UPDATE runs SET status = :status WHERE id = :id', { ':status': status, ':id': id });
      return this.getRun(id);
    },

    // --- events ----------------------------------------------------------
    // dedupeKey lets the sync engine be idempotent: re-running a sync tick
    // over the same GitHub facts never produces duplicate timeline entries.
    recordEvent({ missionId, runId = null, type, actor, message, timestamp, payload = null, source, dedupeKey = null }) {
      if (dedupeKey) {
        const existing = db.get('SELECT * FROM events WHERE dedupe_key = :dedupeKey', { ':dedupeKey': dedupeKey });
        if (existing) return existing;
      }
      db.run(
        `INSERT INTO events (mission_id, run_id, type, actor, message, timestamp, payload, source, dedupe_key)
         VALUES (:missionId, :runId, :type, :actor, :message, :timestamp, :payload, :source, :dedupeKey)`,
        {
          ':missionId': missionId,
          ':runId': runId,
          ':type': type,
          ':actor': actor,
          ':message': message,
          ':timestamp': timestamp,
          ':payload': toJson(payload),
          ':source': source,
          ':dedupeKey': dedupeKey,
        }
      );
      return db.get('SELECT * FROM events WHERE id = last_insert_rowid()');
    },
    listEvents(missionId) {
      return db.all('SELECT * FROM events WHERE mission_id = :missionId ORDER BY timestamp ASC, id ASC', { ':missionId': missionId }).map((e) => ({
        ...e,
        payload: e.payload ? JSON.parse(e.payload) : null,
      }));
    },

    // --- reviews -----------------------------------------------------
    createReview({ runId, reviewer = 'ChatGPT QA', verdict, nextAction, summary, notVerified = [] }) {
      db.run(
        `INSERT INTO reviews (run_id, reviewer, verdict, next_action, summary, not_verified)
         VALUES (:runId, :reviewer, :verdict, :nextAction, :summary, :notVerified)`,
        {
          ':runId': runId,
          ':reviewer': reviewer,
          ':verdict': verdict,
          ':nextAction': nextAction,
          ':summary': summary,
          ':notVerified': toJson(notVerified),
        }
      );
      const row = db.get('SELECT * FROM reviews WHERE id = last_insert_rowid()');
      return { ...row, not_verified: fromJson(row.not_verified) };
    },
    getReviewForRun(runId) {
      const row = db.get('SELECT * FROM reviews WHERE run_id = :runId ORDER BY id DESC LIMIT 1', { ':runId': runId });
      if (!row) return null;
      return { ...row, not_verified: fromJson(row.not_verified) };
    },

    // --- findings ------------------------------------------------------
    createFinding({ reviewId, findingKey, severity, status, finding, location, evidence = [], requiredFix, mustPreserve = [], revalidation = [] }) {
      db.run(
        `INSERT INTO findings (review_id, finding_key, severity, status, finding, location, evidence, required_fix, must_preserve, revalidation)
         VALUES (:reviewId, :findingKey, :severity, :status, :finding, :location, :evidence, :requiredFix, :mustPreserve, :revalidation)`,
        {
          ':reviewId': reviewId,
          ':findingKey': findingKey,
          ':severity': severity,
          ':status': status,
          ':finding': finding,
          ':location': location ?? null,
          ':evidence': toJson(evidence),
          ':requiredFix': requiredFix ?? null,
          ':mustPreserve': toJson(mustPreserve),
          ':revalidation': toJson(revalidation),
        }
      );
      return db.get('SELECT * FROM findings WHERE id = last_insert_rowid()');
    },
    listFindingsForReview(reviewId) {
      return db.all('SELECT * FROM findings WHERE review_id = :reviewId ORDER BY id ASC', { ':reviewId': reviewId }).map((f) => ({
        ...f,
        evidence: fromJson(f.evidence),
        must_preserve: fromJson(f.must_preserve),
        revalidation: fromJson(f.revalidation),
      }));
    },

    // --- approvals ------------------------------------------------------
    requestApproval({ missionId, type, reason }) {
      const existing = db.get(
        "SELECT * FROM approvals WHERE mission_id = :missionId AND type = :type AND status = 'PENDING'",
        { ':missionId': missionId, ':type': type }
      );
      if (existing) return existing;
      db.run('INSERT INTO approvals (mission_id, type, reason) VALUES (:missionId, :type, :reason)', {
        ':missionId': missionId,
        ':type': type,
        ':reason': reason ?? null,
      });
      return db.get('SELECT * FROM approvals WHERE id = last_insert_rowid()');
    },
    decideApproval(id, { status, decidedBy, decision }) {
      db.run(
        `UPDATE approvals SET status = :status, decided_by = :decidedBy, decision = :decision, decided_at = :decidedAt
         WHERE id = :id`,
        {
          ':status': status,
          ':decidedBy': decidedBy,
          ':decision': decision ?? null,
          ':decidedAt': new Date().toISOString(),
          ':id': id,
        }
      );
      return db.get('SELECT * FROM approvals WHERE id = :id', { ':id': id });
    },
    listApprovals(missionId) {
      return db.all('SELECT * FROM approvals WHERE mission_id = :missionId ORDER BY id DESC', { ':missionId': missionId });
    },
    getApproval(id) {
      return db.get('SELECT * FROM approvals WHERE id = :id', { ':id': id });
    },
  };
}

module.exports = { createRepository };
