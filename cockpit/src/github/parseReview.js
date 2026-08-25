'use strict';

// Parses the PASS-AI-REVIEW comment format that .orchestrator/reviewer.mjs
// posts to the PR (see the `lines` array built at the bottom of that
// file). The cockpit deliberately reads this existing, already-working
// contract instead of inventing a second channel — see cahier des
// charges section 51 ("réutiliser l'existant lorsque c'est fiable").
//
// Doctrine (section 4): if the comment does not match the expected
// shape, this returns null rather than guessing — an unparsed comment
// must never be treated as a hidden GO.

const MARKER_RE = /<!--\s*PASS-AI-REVIEW\s+run=(\S+?)\s*-->/;
const VERDICT_RE = /^## ChatGPT QA — (.+)$/m;
const ACTION_RE = /^\*\*Action:\*\*\s*(.+)$/m;
const NOT_VERIFIED_RE = /^\*\*Non vérifié:\*\*\s*(.+)$/m;
const FINDING_HEADER_RE = /^### (\S+) — (\S+) — (\S+)$/gm;

function splitPipeList(value) {
  if (!value) return [];
  return value
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);
}

function extractField(block, label) {
  // [ \t]* (not \s*) after the label: \s would cross the newline and let
  // an empty field silently swallow the next markdown line as its value.
  const re = new RegExp(`^\\*\\*${label}:\\*\\*[ \\t]*(.*)$`, 'm');
  const match = block.match(re);
  if (!match) return null;
  const value = match[1].trim();
  return value || null;
}

function extractFindingText(block) {
  const firstLine = block.split('\n').find((line) => line.trim() && !line.trim().startsWith('**'));
  return firstLine ? firstLine.trim() : '';
}

function isReviewComment(body) {
  return typeof body === 'string' && MARKER_RE.test(body);
}

function parseReviewComment(body) {
  if (!isReviewComment(body)) return null;

  const runMatch = body.match(MARKER_RE);
  const verdictMatch = body.match(VERDICT_RE);
  const actionMatch = body.match(ACTION_RE);
  const notVerifiedMatch = body.match(NOT_VERIFIED_RE);
  if (!verdictMatch) return null;

  const runId = runMatch[1];
  const verdict = verdictMatch[1].trim();
  const nextAction = actionMatch ? actionMatch[1].trim() : null;
  const notVerified = splitPipeList(notVerifiedMatch ? notVerifiedMatch[1] : '');

  // Summary: everything between the verdict header and the first finding
  // header (or the Action line if there are no findings), trimmed.
  const afterVerdict = body.slice(verdictMatch.index + verdictMatch[0].length);
  const headerMatches = [...afterVerdict.matchAll(FINDING_HEADER_RE)];
  const summaryEnd = headerMatches.length ? headerMatches[0].index : afterVerdict.search(/^\*\*Action:\*\*/m);
  const summary = afterVerdict.slice(0, summaryEnd === -1 ? undefined : summaryEnd).trim();

  const findings = [];
  for (let i = 0; i < headerMatches.length; i++) {
    const header = headerMatches[i];
    const [, id, severity, status] = header;
    const blockStart = header.index + header[0].length;
    const blockEnd = i + 1 < headerMatches.length ? headerMatches[i + 1].index : afterVerdict.search(/^\*\*Non vérifié:\*\*|^\*\*Action:\*\*/m);
    const block = afterVerdict.slice(blockStart, blockEnd === -1 ? undefined : blockEnd);
    findings.push({
      id,
      severity,
      status,
      finding: extractFindingText(block),
      location: extractField(block, 'Localisation'),
      evidence: splitPipeList(extractField(block, 'Preuves')),
      required_fix: extractField(block, 'Correction demandée'),
      must_preserve: splitPipeList(extractField(block, 'À préserver')),
      revalidation: splitPipeList(extractField(block, 'Revalidation')),
    });
  }

  return { runId, verdict, nextAction, summary, notVerified, findings };
}

// run_id shape: "${owner}/${repo}#${prNumber}@${head.slice(0,12)}"
function parseRunId(runId) {
  const match = /^(.+)#(\d+)@([0-9a-f]+)$/.exec(runId || '');
  if (!match) return null;
  return { repository: match[1], prNumber: Number(match[2]), headShaPrefix: match[3] };
}

module.exports = { isReviewComment, parseReviewComment, parseRunId };
