'use strict';

// Prototype Tata Nanti (branche pass-academy-tata-nanti-prototype) —
// verrou de doctrine : "phone-photo" ne doit plus contenir aucune
// illustration SVG artisanale (scène ou carte de choix). Tant que l'équipe
// design n'a pas livré les vraies images, chaque illustration doit être un
// repère ASSET_REQUIRED explicite (voir art/scenes-v13.js), jamais une
// interprétation graphique de mon cru. Ce test échoue si un SVG réapparaît,
// ou si le nombre d'assets en attente dérive sans que
// docs/C2.2-TATA-NANTI-ASSETS-REQUIRED.md soit mis à jour en conséquence.
//
// Lancer : node tests/tata-nanti-prototype-assets-pending.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');

// 5 scènes + 2 cartes de choix (bonne/mauvaise réponse) = 7 assets.
const EXPECTED_PENDING_COUNT = 7;

const ctx = loadContentGlobals([
  'art/scenes-v13.js',
  'content/stories-v13.js',
  'content/narrative-pilots-v13.js',
]);

test('"phone-photo" existe toujours dans PASS_STORIES (contenu inchangé, seule l’illustration change)', () => {
  assert.ok(ctx.PASS_STORIES.some((s) => s.id === 'phone-photo'), '"phone-photo" absent de PASS_STORIES');
});

test(`exactement ${EXPECTED_PENDING_COUNT} assets en attente (PASS_ASSET_REQUIRED_LIST)`, () => {
  assert.ok(Array.isArray(ctx.PASS_ASSET_REQUIRED_LIST), 'PASS_ASSET_REQUIRED_LIST doit être un tableau');
  assert.strictEqual(
    ctx.PASS_ASSET_REQUIRED_LIST.length,
    EXPECTED_PENDING_COUNT,
    `${ctx.PASS_ASSET_REQUIRED_LIST.length} asset(s) en attente trouvé(s), ${EXPECTED_PENDING_COUNT} attendu(s) — ` +
    'mettre à jour docs/C2.2-TATA-NANTI-ASSETS-REQUIRED.md si ce nombre change intentionnellement'
  );
});

test('"phone-photo" : aucune illustration de scène en SVG artisanal', () => {
  (ctx.PASS_SCENES['phone-photo'] || []).forEach((visual, i) => {
    assert.ok(
      !visual.trim().startsWith('<svg'),
      `"phone-photo" scène ${i} : SVG artisanal détecté — doit être un asset livré (<img>) ou un repère ASSET_REQUIRED`
    );
  });
});

test('"phone-photo" : aucune carte de choix en SVG artisanal', () => {
  const pilot = ctx.PASS_NARRATIVE_PILOTS['phone-photo'];
  assert.ok(pilot, 'pilote introuvable pour "phone-photo"');
  pilot.scenes.forEach((sc, i) => {
    if (sc.action !== 'choice') return;
    sc.choices.forEach((c, j) => {
      assert.ok(
        !c.visual.trim().startsWith('<svg'),
        `"phone-photo" scène ${i} choix ${j} : SVG artisanal détecté — doit être un asset livré (<img>) ou un repère ASSET_REQUIRED`
      );
    });
  });
});

test('les autres histoires (money, scam, ejustice, ...) gardent leur SVG existant, intact', () => {
  assert.ok(ctx.PASS_SCENES.money[0].trim().startsWith('<svg'), '"money" ne doit pas être affecté par ce prototype');
  assert.ok(ctx.PASS_SCENES.scam[0].trim().startsWith('<svg'), '"scam" ne doit pas être affecté par ce prototype');
});

summary('tata-nanti-prototype-assets-pending.test.js');
