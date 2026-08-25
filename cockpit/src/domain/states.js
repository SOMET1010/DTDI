'use strict';

// Section 8 of the cahier des charges: the exhaustive list of mission
// states the cockpit is allowed to display. Nothing outside this list.
const MISSION_STATES = Object.freeze([
  'IDLE',
  'MISSION_READY',
  'CLAUDE_WORKING',
  'CLAUDE_DONE',
  'TESTING',
  'REVIEWING',
  'GO',
  'GO_WITH_RESERVATIONS',
  'NOK',
  'CLAUDE_CORRECTING',
  'BLOCKED',
  'NOT_VERIFIED',
  'HUMAN_ARBITRATION',
  'FAILED',
]);

const TERMINAL_STATES = Object.freeze(['GO', 'HUMAN_ARBITRATION', 'BLOCKED']);

// Verdicts the independent reviewer (ChatGPT QA) may emit — see
// .orchestrator/reviewer.mjs and PASS_ACADEMY_REVIEW_CONTRACT.md, which
// this cockpit reads rather than reimplements.
const REVIEW_VERDICTS = Object.freeze([
  'GO',
  'GO_WITH_RESERVATIONS',
  'NOK',
  'BLOCKED',
  'NOT_VERIFIED',
]);

const NEXT_ACTIONS = Object.freeze([
  'PROCEED',
  'CORRECT_AND_RESUBMIT',
  'REQUEST_HUMAN_ARBITRATION',
  'PROVIDE_MISSING_EVIDENCE',
  'STOP_SECURITY_REVIEW',
]);

function isValidState(state) {
  return MISSION_STATES.includes(state);
}

// Doctrine (section 4): "VISIBLE = PROUVÉ". A verdict never present in
// REVIEW_VERDICTS must never be silently accepted as a mission state.
function stateFromVerdict(verdict) {
  if (REVIEW_VERDICTS.includes(verdict)) return verdict;
  return 'NOT_VERIFIED';
}

// Section 40 — protection anti-boucle: once current_cycle has reached
// max_cycles and a fresh NOK/CORRECT_AND_RESUBMIT verdict lands, no
// further automatic Claude call may happen; escalate to a human instead.
function nextMissionStatus({ verdict, nextAction, currentCycle, maxCycles }) {
  if (nextAction === 'REQUEST_HUMAN_ARBITRATION') {
    return 'HUMAN_ARBITRATION';
  }
  if (nextAction === 'CORRECT_AND_RESUBMIT') {
    if (currentCycle >= maxCycles) {
      return 'HUMAN_ARBITRATION';
    }
    return 'CLAUDE_CORRECTING';
  }
  if (nextAction === 'STOP_SECURITY_REVIEW') {
    return 'BLOCKED';
  }
  if (nextAction === 'PROVIDE_MISSING_EVIDENCE') {
    return 'NOT_VERIFIED';
  }
  return stateFromVerdict(verdict);
}

module.exports = {
  MISSION_STATES,
  TERMINAL_STATES,
  REVIEW_VERDICTS,
  NEXT_ACTIONS,
  isValidState,
  stateFromVerdict,
  nextMissionStatus,
};
