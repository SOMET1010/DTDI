'use strict';

// C1.10 (amorce, étendue en C1.3) — tests de structure sur le contenu V1.3.
// But : détecter toute rupture du contrat de données pendant le refactor,
// sans imposer de changement de format au-delà de ce que C1.3 a introduit
// (chaque histoire du catalogue doit désormais résoudre vers un pilote
// scenes[] : c'est devenu le seul moteur, cf. narrative-engine.js).
//
// Lancer : node tests/content-structure.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');

const RECOGNIZED_ACTIONS = ['next', 'choice', 'finish'];
const EXPECTED_STORY_COUNT = 10;
// Repère d'asset en attente (prototype Tata Nanti, voir art/scenes-v13.js) :
// accepté comme illustration valide au même titre qu'un <svg>/<img> livré.
const ASSET_REQUIRED_MARKER = 'class="assetRequired"';

console.log(
  'Chargement de content/stories-v13.js, ejustice-pilot-v13.js, narrative-pilots-v13.js, ' +
  'basic-pilots-v13.js, art/scenes-v13.js...\n'
);

const ctx = loadContentGlobals([
  'art/scenes-v13.js',
  'content/stories-v13.js',
  'content/ejustice-pilot-v13.js',
  'content/narrative-pilots-v13.js',
  'content/basic-pilots-v13.js',
]);

const stories = ctx.PASS_STORIES;
const ejusticePilot = ctx.PASS_EJUSTICE_PILOT;
const narrativePilots = ctx.PASS_NARRATIVE_PILOTS;
const basicPilots = ctx.PASS_BASIC_PILOTS;
const sceneArt = ctx.PASS_SCENES || {};

function getPilot(id) {
  if (id === 'ejustice') return ejusticePilot;
  return (narrativePilots && narrativePilots[id]) || (basicPilots && basicPilots[id]);
}

// --- Catalogue (PASS_STORIES) ---

test('PASS_STORIES se charge et est un tableau non vide', () => {
  assert.ok(Array.isArray(stories), 'PASS_STORIES doit être un tableau');
  assert.ok(stories.length > 0, 'PASS_STORIES est vide');
});

test(`les ${EXPECTED_STORY_COUNT} histoires du catalogue existent`, () => {
  assert.strictEqual(
    stories.length,
    EXPECTED_STORY_COUNT,
    `catalogue attendu à ${EXPECTED_STORY_COUNT} histoires, trouvé ${stories.length}`
  );
});

test('les ids du catalogue sont uniques', () => {
  const ids = stories.map((s) => s.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.strictEqual(
    new Set(ids).size,
    ids.length,
    `ids dupliqués détectés : ${duplicates.join(', ')}`
  );
});

// --- Histoires jouables (moteur unique depuis C1.3) ---
// Toute histoire du catalogue doit résoudre vers un pilote scenes[] :
// il n'existe plus de second moteur de secours (renderBasic supprimé).

const STORY_IDS = stories.map((s) => s.id);

test('chaque histoire du catalogue résout vers un pilote (scenes[])', () => {
  for (const id of STORY_IDS) {
    const pilot = getPilot(id);
    assert.ok(pilot, `aucun pilote pour l'histoire "${id}"`);
    assert.strictEqual(
      pilot.id,
      id,
      `id interne du pilote "${id}" incohérent (trouvé "${pilot && pilot.id}")`
    );
  }
});

for (const id of STORY_IDS) {
  const pilot = getPilot(id);
  if (!pilot) continue; // déjà signalé par le test précédent

  test(`"${id}" : au moins une scène`, () => {
    assert.ok(Array.isArray(pilot.scenes), `"${id}".scenes doit être un tableau`);
    assert.ok(pilot.scenes.length >= 1, `"${id}" n'a aucune scène`);
  });

  test(`"${id}" : chaque scène a une action reconnue (${RECOGNIZED_ACTIONS.join('/')})`, () => {
    pilot.scenes.forEach((sc, i) => {
      assert.ok(
        RECOGNIZED_ACTIONS.includes(sc.action),
        `"${id}" scène ${i} : action "${sc.action}" non reconnue`
      );
    });
  });

  test(`"${id}" : chaque scène a une voix non vide`, () => {
    pilot.scenes.forEach((sc, i) => {
      assert.ok(
        typeof sc.voice === 'string' && sc.voice.trim().length > 0,
        `"${id}" scène ${i} : voix vide ou absente`
      );
    });
  });

  test(`"${id}" : chaque scène "choice" a au moins 2 choix`, () => {
    pilot.scenes.forEach((sc, i) => {
      if (sc.action !== 'choice') return;
      assert.ok(
        Array.isArray(sc.choices) && sc.choices.length >= 2,
        `"${id}" scène ${i} : moins de 2 choix (${(sc.choices || []).length})`
      );
    });
  });

  test(`"${id}" : chaque scène "choice" a exactement une réponse correcte`, () => {
    pilot.scenes.forEach((sc, i) => {
      if (sc.action !== 'choice') return;
      const goodCount = sc.choices.filter((c) => c.good === true).length;
      assert.strictEqual(
        goodCount,
        1,
        `"${id}" scène ${i} : ${goodCount} réponse(s) correcte(s) au lieu de 1`
      );
    });
  });

  test(`"${id}" : atteint une scène "finish"`, () => {
    assert.ok(
      pilot.scenes.some((sc) => sc.action === 'finish'),
      `"${id}" n'a pas de scène "finish"`
    );
  });

  test(`"${id}" : chaque scène a une illustration (art/scenes-v13.js)`, () => {
    const art = sceneArt[id];
    assert.ok(
      Array.isArray(art) && art.length === pilot.scenes.length,
      `"${id}" : PASS_SCENES doit avoir ${pilot.scenes.length} illustration(s), trouvé ${(art || []).length}`
    );
    art.forEach((svg, i) => {
      const trimmed = typeof svg === 'string' ? svg.trim() : '';
      assert.ok(
        trimmed.startsWith('<svg') || trimmed.startsWith('<img') || trimmed.includes(ASSET_REQUIRED_MARKER),
        `"${id}" scène ${i} : illustration absente ou invalide (attendu <svg>, <img>, ou un repère ASSET_REQUIRED explicite)`
      );
    });
  });
}

summary('content-structure.test.js');
