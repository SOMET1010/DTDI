'use strict';

// C2.1 — Verrou de doctrine : les 4 histoires Famille B ne doivent contenir
// aucune illustration SVG artisanale (scène ou carte de choix). Tant que
// l'équipe design n'a pas livré les assets, chaque illustration doit être un
// repère ASSET_REQUIRED explicite (voir art/scenes-famille-b.js), jamais une
// interprétation graphique de mon cru. Ce test échoue si un SVG apparaît sur
// l'une de ces 4 histoires, ou si le nombre d'assets en attente dérive sans
// que docs/C2.1-ASSETS-REQUIRED.md soit mis à jour en conséquence.
//
// Lancer : node tests/famille-b-assets-pending.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');

const FAMILLE_B_IDS = ['crop-price', 'health-visit', 'job-search', 'study-help'];
// 4 histoires x (3 scènes + 3 cartes de choix) = 24 assets à fournir.
const EXPECTED_PENDING_COUNT = 24;

const ctx = loadContentGlobals([
  'art/scenes-v13.js',
  'art/scenes-famille-b.js',
  'content/stories-v13.js',
  'content/famille-b-stories.js',
  'content/basic-pilots-v13.js',
  'content/famille-b-pilots.js',
]);

test('les 4 histoires Famille B existent dans PASS_STORIES', () => {
  const ids = ctx.PASS_STORIES.map((s) => s.id);
  FAMILLE_B_IDS.forEach((id) => assert.ok(ids.includes(id), `"${id}" absent de PASS_STORIES`));
});

test(`exactement ${EXPECTED_PENDING_COUNT} assets en attente (PASS_ASSET_REQUIRED_LIST)`, () => {
  assert.ok(Array.isArray(ctx.PASS_ASSET_REQUIRED_LIST), 'PASS_ASSET_REQUIRED_LIST doit être un tableau');
  assert.strictEqual(
    ctx.PASS_ASSET_REQUIRED_LIST.length,
    EXPECTED_PENDING_COUNT,
    `${ctx.PASS_ASSET_REQUIRED_LIST.length} asset(s) en attente trouvé(s), ${EXPECTED_PENDING_COUNT} attendu(s) — ` +
    'mettre à jour docs/C2.1-ASSETS-REQUIRED.md si ce nombre change intentionnellement'
  );
});

for (const id of FAMILLE_B_IDS) {
  test(`"${id}" : aucune illustration de scène en SVG artisanal (uniquement asset livré ou ASSET_REQUIRED)`, () => {
    (ctx.PASS_SCENES[id] || []).forEach((visual, i) => {
      assert.ok(
        !visual.trim().startsWith('<svg'),
        `"${id}" scène ${i} : SVG artisanal détecté — doit être un asset livré (<img>) ou un repère ASSET_REQUIRED`
      );
    });
  });

  test(`"${id}" : aucune carte de choix en SVG artisanal`, () => {
    const pilot = ctx.PASS_BASIC_PILOTS[id];
    assert.ok(pilot, `pilote introuvable pour "${id}"`);
    pilot.scenes.forEach((sc, i) => {
      if (sc.action !== 'choice') return;
      sc.choices.forEach((c, j) => {
        assert.ok(
          !c.visual.trim().startsWith('<svg'),
          `"${id}" scène ${i} choix ${j} : SVG artisanal détecté — doit être un asset livré (<img>) ou un repère ASSET_REQUIRED`
        );
      });
    });
  });
}

summary('famille-b-assets-pending.test.js');
