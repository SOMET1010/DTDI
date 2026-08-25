'use strict';

// C1.4 — Mode de test zéro lecture.
//
// Ce que ce test PEUT prouver mécaniquement : activer le mode ne casse
// aucune navigation (aucune exception, les 10 histoires du catalogue
// restent terminables). Ce qu'il NE PEUT PAS prouver : qu'une personne ne
// sachant lire aucun mot termine réellement chaque histoire — cette
// simulation n'a pas de moteur de rendu CSS/visuel, rien ne "voit" si un
// texte est effectivement masqué à l'écran. Cette preuve-là reste humaine :
// voir docs/C1.4-RECETTE-ZERO-LECTURE.md.
//
// Lancer : node tests/zero-reading-mode.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadApp, probe, ASSETS_DIR } = require('./lib/dom-shim');
const { test, summary } = require('./lib/mini-test');

test('la règle CSS .zeroRead masque textOptional/h3/cue par visibility (pas une simple opacité)', () => {
  const css = fs.readFileSync(path.join(ASSETS_DIR, 'css', 'app.css'), 'utf8');
  const rule = css.match(/\.zeroRead[^{]*\{[^}]*\}/);
  assert.ok(rule, 'règle .zeroRead introuvable dans css/app.css');
  assert.ok(rule[0].includes('visibility:hidden'), 'la règle doit utiliser visibility:hidden, pas opacity');
  assert.ok(rule[0].includes('.textOptional'), 'doit couvrir .textOptional');
  assert.ok(rule[0].includes('h3'), 'doit couvrir h3');
  assert.ok(rule[0].includes('.cue'), 'doit couvrir .cue (indice de scène, lui aussi facultatif)');
});

test('activer le mode zéro lecture ne lève aucune exception', () => {
  const { sandbox } = loadApp();
  const app = sandbox.document.getElementById('app');
  assert.strictEqual(app.classList.contains('zeroRead'), false, 'le mode ne doit pas être actif par défaut');
  sandbox.toggleRead();
  assert.strictEqual(app.classList.contains('zeroRead'), true, 'toggleRead() doit activer le mode');
  sandbox.toggleRead();
  assert.strictEqual(app.classList.contains('zeroRead'), false, 'toggleRead() doit pouvoir le désactiver');
});

test('les 10 histoires restent terminables (finish()) une fois le mode zéro lecture actif', () => {
  const { sandbox } = loadApp();
  sandbox.toggleRead();
  const getState = probe(sandbox);

  for (const catalogEntry of sandbox.PASS_STORIES) {
    sandbox.openStory(catalogEntry);
    let state = getState();
    assert.ok(state.activePilot, `activePilot non défini pour "${catalogEntry.id}"`);

    let guard = 0;
    while (state.activePilot && guard < 20) {
      const sc = state.activePilot.scenes[state.pilotIndex];
      if (sc.action === 'choice') {
        sandbox.pilotAnswer(sc.choices.findIndex((c) => c.good));
      } else if (sc.action === 'next') {
        sandbox.pilotNext();
      } else if (sc.action === 'finish') {
        sandbox.finish(catalogEntry.id);
      }
      guard++;
      state = getState();
    }
    assert.ok(!state.activePilot, `"${catalogEntry.id}" ne se termine pas (boucle non close après ${guard} étapes)`);
  }
});

summary('zero-reading-mode.test.js');
