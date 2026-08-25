'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextMissionStatus, stateFromVerdict, isValidState, MISSION_STATES } = require('../src/domain/states');

test('stateFromVerdict maps known verdicts through unchanged', () => {
  for (const v of ['GO', 'GO_WITH_RESERVATIONS', 'NOK', 'BLOCKED', 'NOT_VERIFIED']) {
    assert.equal(stateFromVerdict(v), v);
  }
});

test('stateFromVerdict never invents a success for an unknown verdict (doctrine: VISIBLE = PROUVÉ)', () => {
  assert.equal(stateFromVerdict('SOMETHING_UNEXPECTED'), 'NOT_VERIFIED');
  assert.equal(stateFromVerdict(undefined), 'NOT_VERIFIED');
  assert.equal(stateFromVerdict(''), 'NOT_VERIFIED');
});

test('nextMissionStatus: PROCEED with a GO verdict yields GO', () => {
  const status = nextMissionStatus({ verdict: 'GO', nextAction: 'PROCEED', currentCycle: 1, maxCycles: 2 });
  assert.equal(status, 'GO');
});

test('nextMissionStatus: CORRECT_AND_RESUBMIT under the cycle limit yields CLAUDE_CORRECTING', () => {
  const status = nextMissionStatus({ verdict: 'NOK', nextAction: 'CORRECT_AND_RESUBMIT', currentCycle: 1, maxCycles: 2 });
  assert.equal(status, 'CLAUDE_CORRECTING');
});

test('nextMissionStatus: anti-loop guard (section 40) escalates once current_cycle >= max_cycles', () => {
  const status = nextMissionStatus({ verdict: 'NOK', nextAction: 'CORRECT_AND_RESUBMIT', currentCycle: 2, maxCycles: 2 });
  assert.equal(status, 'HUMAN_ARBITRATION');
});

test('nextMissionStatus: REQUEST_HUMAN_ARBITRATION always escalates regardless of cycle count', () => {
  const status = nextMissionStatus({ verdict: 'NOK', nextAction: 'REQUEST_HUMAN_ARBITRATION', currentCycle: 0, maxCycles: 5 });
  assert.equal(status, 'HUMAN_ARBITRATION');
});

test('nextMissionStatus: STOP_SECURITY_REVIEW yields BLOCKED', () => {
  const status = nextMissionStatus({ verdict: 'BLOCKED', nextAction: 'STOP_SECURITY_REVIEW', currentCycle: 0, maxCycles: 2 });
  assert.equal(status, 'BLOCKED');
});

test('nextMissionStatus: PROVIDE_MISSING_EVIDENCE yields NOT_VERIFIED', () => {
  const status = nextMissionStatus({ verdict: 'NOT_VERIFIED', nextAction: 'PROVIDE_MISSING_EVIDENCE', currentCycle: 0, maxCycles: 2 });
  assert.equal(status, 'NOT_VERIFIED');
});

test('isValidState rejects anything outside the fixed section-8 enum', () => {
  assert.equal(isValidState('GO'), true);
  assert.equal(isValidState('PAUSED'), false);
  assert.equal(MISSION_STATES.includes('PAUSED'), false);
});
