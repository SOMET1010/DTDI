'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isReviewComment, parseReviewComment, parseRunId } = require('../src/github/parseReview');

function buildComment({ verdict = 'NOK', action = 'CORRECT_AND_RESUBMIT', headSha = 'a9fb1b7c123456789abc' } = {}) {
  return [
    `<!-- PASS-AI-REVIEW run=SOMET1010/DTDI#1@${headSha.slice(0, 12)} -->`,
    `## ChatGPT QA — ${verdict}`,
    '',
    'Une anomalie majeure détectée sur le lot C1.3.',
    '',
    '### NOK-C13-004 — MAJEURE — FAIL',
    'Une option est validée immédiatement sans pré-écoute SUTA.',
    '**Localisation:** app/src/main/assets/js/renderers.js',
    '**Preuves:** log-1.txt | screenshot-2.png',
    '**Correction demandée:** séparer pré-écoute et validation.',
    '**À préserver:** offline-first | zéro lecture',
    '**Revalidation:** rejouer le parcours SUTA',
    '',
    '### NOK-C13-005 — MINEURE — RESERVATION',
    'Texte facultatif non testé sur petit écran.',
    '**Localisation:** app/src/main/assets/css/app.css',
    '**Preuves:** ',
    '**Correction demandée:** vérifier le responsive.',
    '**À préserver:** ',
    '**Revalidation:** ',
    '',
    '**Non vérifié:** comportement offline réel sur device',
    '',
    `**Action:** ${action}`,
    '',
    '@claude Correction automatique demandée sur les seuls constats NOK ci-dessus.',
    '',
  ].join('\n');
}

test('isReviewComment rejects unrelated PR comments', () => {
  assert.equal(isReviewComment('Nice work!'), false);
  assert.equal(isReviewComment(null), false);
  assert.equal(isReviewComment(undefined), false);
});

test('parseReviewComment extracts verdict, action, summary and run id', () => {
  const parsed = parseReviewComment(buildComment());
  assert.equal(parsed.verdict, 'NOK');
  assert.equal(parsed.nextAction, 'CORRECT_AND_RESUBMIT');
  assert.equal(parsed.summary, 'Une anomalie majeure détectée sur le lot C1.3.');
  assert.equal(parsed.runId, 'SOMET1010/DTDI#1@a9fb1b7c1234');
  assert.deepEqual(parsed.notVerified, ['comportement offline réel sur device']);
});

test('parseReviewComment extracts every finding with pipe-separated lists', () => {
  const parsed = parseReviewComment(buildComment());
  assert.equal(parsed.findings.length, 2);
  const [f1, f2] = parsed.findings;
  assert.equal(f1.id, 'NOK-C13-004');
  assert.equal(f1.severity, 'MAJEURE');
  assert.equal(f1.status, 'FAIL');
  assert.deepEqual(f1.evidence, ['log-1.txt', 'screenshot-2.png']);
  assert.deepEqual(f1.must_preserve, ['offline-first', 'zéro lecture']);
  assert.equal(f2.id, 'NOK-C13-005');
});

test('parseReviewComment: an empty field never swallows the next markdown line as its value', () => {
  // Regression test: `\s*` after a label used to cross the newline and
  // capture the following "**Label:**" line as the value.
  const parsed = parseReviewComment(buildComment());
  const f2 = parsed.findings[1];
  assert.deepEqual(f2.evidence, []);
  assert.deepEqual(f2.must_preserve, []);
  assert.deepEqual(f2.revalidation, []);
  assert.equal(f2.required_fix, 'vérifier le responsive.');
});

test('parseReviewComment returns null for a comment without the PASS-AI-REVIEW marker', () => {
  assert.equal(parseReviewComment('## ChatGPT QA — GO\n\nAll good.'), null);
});

test('parseRunId decodes owner/repo, PR number and head sha prefix', () => {
  const decoded = parseRunId('SOMET1010/DTDI#1@a9fb1b7c1234');
  assert.deepEqual(decoded, { repository: 'SOMET1010/DTDI', prNumber: 1, headShaPrefix: 'a9fb1b7c1234' });
});

test('parseRunId returns null for a malformed run id', () => {
  assert.equal(parseRunId('not-a-run-id'), null);
  assert.equal(parseRunId(''), null);
});

test('a GO comment with no findings still parses (empty findings array)', () => {
  const body = [
    '<!-- PASS-AI-REVIEW run=SOMET1010/DTDI#1@abcdef123456 -->',
    '## ChatGPT QA — GO',
    '',
    'Tout est conforme et prouvé.',
    '',
    '**Action:** PROCEED',
    '',
  ].join('\n');
  const parsed = parseReviewComment(body);
  assert.equal(parsed.verdict, 'GO');
  assert.equal(parsed.nextAction, 'PROCEED');
  assert.deepEqual(parsed.findings, []);
  assert.deepEqual(parsed.notVerified, []);
});
