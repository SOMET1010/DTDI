'use strict';

// Vanilla JS on purpose (no build step) — same low-tooling philosophy as
// the rest of this repository. Polls the cockpit API every 10s (section
// 21: 5-15s is an accepted MVP value; SSE/WebSocket can replace this
// later without changing the render functions below).

const POLL_MS = 10000;
const HEALTH_POLL_MS = 30000;
const DECIDED_BY = 'Patrick';

const el = (id) => document.getElementById(id);

// Section 30: visual codes that never rely on color alone — every state
// carries an icon + a label.
const STATE_META = {
  IDLE: { icon: '⏸', label: 'Inactif', tone: 'blocked' },
  MISSION_READY: { icon: '▶', label: 'Mission prête', tone: 'active' },
  CLAUDE_WORKING: { icon: '🤖', label: 'Claude travaille', tone: 'active' },
  CLAUDE_DONE: { icon: '🤖', label: 'Claude a terminé', tone: 'active' },
  TESTING: { icon: '🧪', label: 'Tests en cours', tone: 'active' },
  REVIEWING: { icon: '🔎', label: 'ChatGPT contrôle', tone: 'active' },
  GO: { icon: '✓', label: 'GO', tone: 'go' },
  GO_WITH_RESERVATIONS: { icon: '!', label: 'GO avec réserves', tone: 'reserve' },
  NOK: { icon: '✕', label: 'NOK', tone: 'nok' },
  CLAUDE_CORRECTING: { icon: '🤖', label: 'Claude corrige', tone: 'active' },
  BLOCKED: { icon: '⏸', label: 'Bloqué', tone: 'blocked' },
  NOT_VERIFIED: { icon: '?', label: 'Non vérifié', tone: 'notverified' },
  HUMAN_ARBITRATION: { icon: '👤', label: 'Patrick requis', tone: 'nok' },
  FAILED: { icon: '⚠', label: 'Panne orchestration', tone: 'blocked' },
};

const VERDICT_TONE = {
  GO: 'go',
  GO_WITH_RESERVATIONS: 'reserve',
  NOK: 'nok',
  BLOCKED: 'blocked',
  NOT_VERIFIED: 'notverified',
};

const PIPELINE_STEPS = ['Mission', 'Claude', 'Commit', 'Tests', 'Build', 'ChatGPT QA', 'Issue'];

function pipelineStatusFor(step, status, verdict) {
  const order = ['MISSION_READY', 'CLAUDE_WORKING', 'COMMIT', 'TESTING', 'BUILD', 'REVIEWING', 'ISSUE'];
  const terminal = ['GO', 'GO_WITH_RESERVATIONS', 'NOK', 'BLOCKED', 'HUMAN_ARBITRATION', 'FAILED', 'NOT_VERIFIED'];

  if (status === 'IDLE') return step === 'Mission' ? 'pending' : 'pending';

  const map = {
    Mission: () => 'success',
    Claude: () => (['CLAUDE_WORKING', 'CLAUDE_CORRECTING'].includes(status) ? 'active' : (status === 'MISSION_READY' ? 'pending' : 'success')),
    Commit: () => (['MISSION_READY'].includes(status) ? 'pending' : 'success'),
    Tests: () => (status === 'TESTING' ? 'active' : (status === 'MISSION_READY' ? 'pending' : 'success')),
    Build: () => (status === 'TESTING' ? 'active' : (status === 'MISSION_READY' ? 'pending' : 'success')),
    'ChatGPT QA': () => {
      if (status === 'REVIEWING') return 'active';
      if (['MISSION_READY', 'TESTING', 'CLAUDE_WORKING', 'CLAUDE_CORRECTING'].includes(status)) return 'pending';
      if (status === 'FAILED') return 'failure';
      return 'success';
    },
    Issue: () => {
      if (!terminal.includes(status) || status === 'FAILED') return 'pending';
      if (status === 'GO') return 'success';
      if (status === 'GO_WITH_RESERVATIONS') return 'success';
      if (status === 'HUMAN_ARBITRATION' || status === 'BLOCKED') return 'blocked';
      if (status === 'NOK' || status === 'NOT_VERIFIED') return 'failure';
      return 'pending';
    },
  };
  return map[step] ? map[step]() : 'pending';
}

async function api(pathname, opts) {
  const res = await fetch(pathname, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function relativeTime(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.round(diffMs / 1000);
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s} secondes`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

// ---------------- theme ----------------
function initTheme() {
  const saved = localStorage.getItem('cockpit-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  el('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cockpit-theme', next);
  });
}

// ---------------- health ----------------
async function refreshHealth() {
  try {
    const health = await api('/health');
    const ok = health.database === 'OK' && (health.github === 'OK' || health.github === 'NOT_CONFIGURED');
    el('healthBadge').textContent = `DB ${health.database === 'OK' ? '✓' : '✕'} · GitHub ${health.github}`;
    el('healthBadge').title = JSON.stringify(health, null, 2);
    el('healthBadge').style.opacity = ok ? '1' : '0.7';
  } catch {
    el('healthBadge').textContent = 'Diagnostic indisponible';
  }
}

// ---------------- missions / projects ----------------
let missions = [];
let projects = [];
let currentMissionId = null;
let pollHandle = null;

async function loadMissionsAndProjects() {
  [projects, missions] = await Promise.all([api('/projects'), api('/missions')]);
  const select = el('missionSelect');
  select.innerHTML = '';
  if (!missions.length) {
    const opt = document.createElement('option');
    opt.textContent = 'Aucune mission';
    opt.value = '';
    select.appendChild(opt);
  } else {
    for (const m of missions) {
      const opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = `${m.mission_key} — ${m.lot}`;
      select.appendChild(opt);
    }
  }

  const fProject = el('fProject');
  fProject.innerHTML = '';
  for (const p of projects) {
    const opt = document.createElement('option');
    opt.value = String(p.id);
    opt.textContent = `${p.name} (${p.repository})`;
    fProject.appendChild(opt);
  }

  const saved = Number(localStorage.getItem('cockpit-mission-id'));
  const target = missions.find((m) => m.id === saved) || missions[0];
  if (target) {
    select.value = String(target.id);
    await selectMission(target.id);
  } else {
    el('emptyState').classList.remove('hidden');
    el('cockpit').classList.add('hidden');
  }
}

async function selectMission(id) {
  currentMissionId = id;
  localStorage.setItem('cockpit-mission-id', String(id));
  el('emptyState').classList.add('hidden');
  el('cockpit').classList.remove('hidden');
  await refreshCockpit();
}

// ---------------- rendering ----------------
function renderStateBanner(data) {
  const { mission, latestRun } = data;
  const meta = STATE_META[mission.status] || { icon: '?', label: mission.status, tone: 'notverified' };
  el('stateIcon').textContent = meta.icon;
  el('stateLabel').textContent = meta.label;
  const lastEvent = data.events[data.events.length - 1];
  el('stateMeta').textContent = lastEvent
    ? `${lastEvent.message} — ${lastEvent.actor} — ${relativeTime(lastEvent.timestamp)}`
    : 'Aucun événement encore';
  el('stateBanner').dataset.tone = meta.tone;
  el('cycleBadge').textContent = `cycle ${mission.current_cycle || 0} / ${mission.max_cycles}`;
}

function renderMissionHeader(data) {
  const { mission, project } = data;
  el('projectName').textContent = project ? project.name : 'Projet';
  el('missionLine').textContent = `Lot ${mission.lot} — ${mission.objective}`;
  el('prLink').textContent = mission.pr_number ? `PR #${mission.pr_number}` : 'Aucune PR liée';
  const lastEvent = data.events[data.events.length - 1];
  el('lastActivity').textContent = lastEvent ? `Dernière activité : ${relativeTime(lastEvent.timestamp)}` : '';
}

function renderArbitration(data) {
  const panel = el('arbitrationPanel');
  const pending = data.approvals.find((a) => a.status === 'PENDING');
  if (data.mission.status !== 'HUMAN_ARBITRATION' || !pending) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  el('arbitrationReason').textContent = pending.reason || 'Désaccord persistant ou périmètre sensible.';
  panel.querySelectorAll('[data-decision]').forEach((btn) => {
    btn.onclick = async () => {
      await api(`/approvals/${pending.id}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision: btn.dataset.decision, decidedBy: DECIDED_BY }),
      });
      await refreshCockpit();
    };
  });
  el('pauseBtn').onclick = async () => {
    await api(`/missions/${data.mission.id}/pause`, { method: 'POST' });
    await refreshCockpit();
  };
  el('resumeBtn').onclick = async () => {
    await api(`/missions/${data.mission.id}/resume`, { method: 'POST' });
    await refreshCockpit();
  };
}

function renderPipeline(data) {
  const container = el('pipeline');
  container.innerHTML = '';
  PIPELINE_STEPS.forEach((step, i) => {
    if (i > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'pipeline-arrow';
      arrow.textContent = '→';
      container.appendChild(arrow);
    }
    const box = document.createElement('div');
    const status = pipelineStatusFor(step, data.mission.status, data.review?.verdict);
    box.className = `pipeline-step ${status}`;
    box.textContent = step;
    container.appendChild(box);
  });
}

function renderClaudeCard(data) {
  const facts = el('claudeFacts');
  facts.innerHTML = '';
  const add = (term, value) => {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value ?? '—';
    facts.append(dt, dd);
  };
  add('Lot', data.mission.lot);
  add('Objectif', data.mission.objective);
  add('Cycle', `${data.mission.current_cycle} / ${data.mission.max_cycles}`);
  if (data.latestRun) {
    add('Branche', data.latestRun.branch);
    add('Commit', data.latestRun.head_sha ? data.latestRun.head_sha.slice(0, 12) : '—');
    add('Statut du run', data.latestRun.status);
  } else {
    add('Commit', 'Aucun commit détecté');
  }
}

function findingSeverityClass(sev) {
  return (sev || '').toUpperCase();
}

function renderReviewCard(data) {
  const badge = el('verdictBadge');
  if (data.review) {
    badge.textContent = data.review.verdict;
    badge.dataset.tone = VERDICT_TONE[data.review.verdict] || 'notverified';
    el('reviewSummary').textContent = data.review.summary || '—';
  } else {
    badge.textContent = 'NON VÉRIFIÉ';
    badge.dataset.tone = 'notverified';
    el('reviewSummary').textContent = 'Aucune revue ChatGPT QA disponible pour ce commit.';
  }

  const counts = { CRITICAL: 0, CRITIQUE: 0, MAJOR: 0, MAJEURE: 0, MINOR: 0, MINEURE: 0 };
  for (const f of data.findings) {
    const key = findingSeverityClass(f.severity);
    if (key in counts) counts[key]++;
  }
  const critiques = counts.CRITICAL + counts.CRITIQUE;
  const majeures = counts.MAJOR + counts.MAJEURE;
  const mineures = counts.MINOR + counts.MINEURE;
  el('findingsCounts').innerHTML = '';
  [
    ['Critiques', critiques],
    ['Majeures', majeures],
    ['Mineures', mineures],
    ['Non vérifié', data.review?.not_verified?.length || 0],
  ].forEach(([label, n]) => {
    const span = document.createElement('span');
    span.textContent = `${label}: ${n}`;
    el('findingsCounts').appendChild(span);
  });

  const list = el('findingsList');
  list.innerHTML = '';
  for (const f of data.findings) {
    const li = document.createElement('li');
    li.className = 'finding-item';
    const sevClass = findingSeverityClass(f.severity);
    li.innerHTML = `
      <div class="fi-head">
        <span>${f.finding_key}</span>
        <span class="fi-severity ${sevClass}">${f.severity} · ${f.status}</span>
      </div>
      <div>${f.finding}</div>
      ${f.location ? `<div class="fi-fix">📍 ${f.location}</div>` : ''}
      ${f.required_fix ? `<div class="fi-fix">🛠 ${f.required_fix}</div>` : ''}
    `;
    list.appendChild(li);
  }
}

function renderTimeline(data) {
  const showTech = el('techToggle').checked;
  const list = el('timeline');
  list.innerHTML = '';
  const events = [...data.events].reverse();
  for (const e of events) {
    const li = document.createElement('li');
    li.className = 'timeline-item';
    li.innerHTML = `
      <div class="timeline-time">${new Date(e.timestamp).toLocaleString('fr-FR')} — ${e.actor}</div>
      <div class="timeline-message">${e.message}</div>
      ${showTech && e.payload ? `<div class="timeline-payload">${JSON.stringify(e.payload, null, 2)}</div>` : ''}
    `;
    list.appendChild(li);
  }
  if (!events.length) {
    const li = document.createElement('li');
    li.className = 'timeline-item';
    li.innerHTML = '<div class="timeline-message">Aucun événement pour le moment.</div>';
    list.appendChild(li);
  }
}

// Fetched lazily, separately from the main cockpit payload: it needs one
// extra round trip to GitHub per artifact (list artifacts -> list files
// inside the zip) so it must never block the state banner / cards from
// rendering immediately.
async function renderVisualEvidence(runId) {
  const container = el('visualEvidence');
  if (!runId) {
    container.innerHTML = '<p class="review-summary">Aucun commit à examiner pour le moment.</p>';
    return;
  }
  container.innerHTML = '<p class="review-summary">Recherche de captures…</p>';
  try {
    const artifacts = await api(`/runs/${runId}/artifacts`);
    if (!artifacts.length) {
      container.innerHTML = '<p class="review-summary">Aucune capture disponible pour ce commit.</p>';
      return;
    }
    const shots = [];
    for (const artifact of artifacts) {
      const files = await api(`/runs/${runId}/artifacts/${artifact.id}/files`);
      for (const file of files) {
        if (file.contentType.startsWith('image/')) {
          shots.push({ artifactId: artifact.id, path: file.path });
        }
      }
    }
    if (!shots.length) {
      container.innerHTML = '<p class="review-summary">Aucune capture disponible pour ce commit — non vérifié visuellement.</p>';
      return;
    }
    container.innerHTML = '';
    for (const shot of shots) {
      const fig = document.createElement('div');
      fig.className = 'evidence-shot';
      const img = document.createElement('img');
      img.src = `/runs/${runId}/artifacts/${shot.artifactId}/files/${shot.path}`;
      img.alt = shot.path;
      img.loading = 'lazy';
      const caption = document.createElement('div');
      caption.className = 'evidence-caption';
      caption.textContent = shot.path.split('/').pop();
      fig.append(img, caption);
      container.appendChild(fig);
    }
  } catch (err) {
    container.innerHTML = `<p class="review-summary">Captures indisponibles : ${err.message}</p>`;
  }
}

async function refreshCockpit() {
  if (!currentMissionId) return;
  const data = await api(`/missions/${currentMissionId}/cockpit`);
  renderStateBanner(data);
  renderMissionHeader(data);
  renderArbitration(data);
  renderPipeline(data);
  renderClaudeCard(data);
  renderReviewCard(data);
  renderTimeline(data);
  renderVisualEvidence(data.latestRun ? data.latestRun.id : null);
}

// ---------------- wiring ----------------
function initControls() {
  el('missionSelect').addEventListener('change', (e) => {
    if (e.target.value) selectMission(Number(e.target.value));
  });

  el('techToggle').addEventListener('change', () => {
    if (currentMissionId) refreshCockpit();
  });

  el('syncBtn').addEventListener('click', async () => {
    if (!currentMissionId) return;
    const btn = el('syncBtn');
    btn.disabled = true;
    btn.dataset.state = 'loading';
    btn.textContent = '⏳ Sync…';
    try {
      await api(`/missions/${currentMissionId}/sync`, { method: 'POST' });
      await refreshCockpit();
      btn.dataset.state = 'done';
      btn.textContent = '✓ Synchronisé';
    } catch (err) {
      btn.dataset.state = 'error';
      btn.textContent = '✕ Échec';
      alert(`Synchronisation impossible : ${err.message}`);
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.dataset.state = '';
        btn.textContent = '↻ Sync';
      }, 1500);
    }
  });

  el('newMissionBtn').addEventListener('click', () => el('missionDialog').showModal());
  el('cancelMissionBtn').addEventListener('click', () => el('missionDialog').close());

  el('missionForm').addEventListener('submit', async () => {
    const payload = {
      missionKey: el('fMissionKey').value.trim(),
      projectId: Number(el('fProject').value),
      lot: el('fLot').value.trim(),
      objective: el('fObjective').value.trim(),
      prNumber: el('fPrNumber').value ? Number(el('fPrNumber').value) : null,
      maxCycles: Number(el('fMaxCycles').value) || 2,
    };
    try {
      const mission = await api('/missions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await loadMissionsAndProjects();
      el('missionSelect').value = String(mission.id);
      await selectMission(mission.id);
    } catch (err) {
      alert(`Création impossible : ${err.message}`);
    }
  });
}

async function boot() {
  initTheme();
  initControls();
  await refreshHealth();
  await loadMissionsAndProjects();
  pollHandle = setInterval(() => refreshCockpit().catch(() => {}), POLL_MS);
  setInterval(() => refreshHealth().catch(() => {}), HEALTH_POLL_MS);
}

boot().catch((err) => {
  console.error('Cockpit failed to start:', err);
});
