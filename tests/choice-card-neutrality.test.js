'use strict';

// C1.9d — Neutralisation des indices de réponse dans les cartes de choix.
//
// Avant sélection, aucune carte de choix ne doit signaler par sa couleur
// si elle est la bonne ou la mauvaise réponse (le fond de la carte est le
// premier <rect> du SVG — le "canvas" de l'icône, pas les formes qui la
// composent). Le feedback vert/erreur n'apparaît qu'APRÈS sélection, via
// les classes CSS .correct/.wrong ajoutées par pilotAnswer() dans
// narrative-engine.js — jamais dans la donnée elle-même.
//
// Lancer : node tests/choice-card-neutrality.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');

const NEUTRAL_FILL = '#F5F7FA';
const CANVAS_RECT = /^<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="(#[0-9A-Fa-f]{6})"\/>/;

const ctx = loadContentGlobals([
  'content/stories-v13.js',
  'content/ejustice-pilot-v13.js',
  'content/narrative-pilots-v13.js',
  'content/basic-pilots-v13.js',
]);

function getPilot(id) {
  if (id === 'ejustice') return ctx.PASS_EJUSTICE_PILOT;
  return (ctx.PASS_NARRATIVE_PILOTS && ctx.PASS_NARRATIVE_PILOTS[id])
    || (ctx.PASS_BASIC_PILOTS && ctx.PASS_BASIC_PILOTS[id]);
}

let totalChoices = 0;

for (const catalogEntry of ctx.PASS_STORIES) {
  const pilot = getPilot(catalogEntry.id);
  if (!pilot) continue; // couvert par ailleurs par content-structure.test.js

  pilot.scenes.forEach((sc, sceneIndex) => {
    if (sc.action !== 'choice') return;

    sc.choices.forEach((choice, choiceIndex) => {
      totalChoices++;
      const label = `"${catalogEntry.id}" scène ${sceneIndex} choix ${choiceIndex}`;

      test(`${label} : le fond de la carte est neutre, quelle que soit la bonne réponse`, () => {
        const match = CANVAS_RECT.exec(choice.visual);
        assert.ok(match, `${label} : fond de carte introuvable ou format inattendu`);
        assert.strictEqual(
          match[1].toUpperCase(),
          NEUTRAL_FILL,
          `${label} (good=${choice.good}) : fond "${match[1]}" au lieu du neutre ${NEUTRAL_FILL} — ` +
          `un fond différent selon good/bad donnerait un indice de couleur avant sélection`
        );
      });
    });
  });
}

test('au moins une carte de choix a été vérifiée', () => {
  assert.ok(totalChoices > 0, 'aucune scène "choice" trouvée — le test ne vérifie rien');
});

summary(`choice-card-neutrality.test.js (${totalChoices} cartes)`);
