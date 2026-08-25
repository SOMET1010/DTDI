'use strict';

// C1.10 (amorce) — tests de structure sur le contenu actuel (V1.3).
// But : détecter toute rupture du contrat de données pendant le refactor
// C1.2/C1.3, sans imposer de changement de format aujourd'hui.
//
// Lancer : node tests/content-structure.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');

const RECOGNIZED_ACTIONS = ['next', 'choice', 'finish'];
const EXPECTED_PILOT_IDS = ['ejustice', 'money', 'phone-photo', 'scam'];
const EXPECTED_STORY_COUNT = 10;

console.log('Chargement de content/stories-v13.js, ejustice-pilot-v13.js, narrative-pilots-v13.js...\n');

const ctx = loadContentGlobals([
  'content/stories-v13.js',
  'content/ejustice-pilot-v13.js',
  'content/narrative-pilots-v13.js',
]);

const stories = ctx.PASS_STORIES;
const ejusticePilot = ctx.PASS_EJUSTICE_PILOT;
const narrativePilots = ctx.PASS_NARRATIVE_PILOTS;

function getPilot(id) {
  if (id === 'ejustice') return ejusticePilot;
  return narrativePilots ? narrativePilots[id] : undefined;
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

// --- Histoires pilotes ---

test('les 4 histoires pilotes (ejustice, money, phone-photo, scam) existent', () => {
  for (const id of EXPECTED_PILOT_IDS) {
    const pilot = getPilot(id);
    assert.ok(pilot, `pilote manquant : "${id}"`);
    assert.strictEqual(
      pilot.id,
      id,
      `id interne du pilote "${id}" incohérent (trouvé "${pilot && pilot.id}")`
    );
  }
});

for (const id of EXPECTED_PILOT_IDS) {
  const pilot = getPilot(id);
  if (!pilot) continue; // déjà signalé par le test précédent

  test(`pilote "${id}" : au moins une scène`, () => {
    assert.ok(Array.isArray(pilot.scenes), `"${id}".scenes doit être un tableau`);
    assert.ok(pilot.scenes.length >= 1, `"${id}" n'a aucune scène`);
  });

  test(`pilote "${id}" : chaque scène a une action reconnue (${RECOGNIZED_ACTIONS.join('/')})`, () => {
    pilot.scenes.forEach((sc, i) => {
      assert.ok(
        RECOGNIZED_ACTIONS.includes(sc.action),
        `"${id}" scène ${i} : action "${sc.action}" non reconnue`
      );
    });
  });

  test(`pilote "${id}" : chaque scène a une voix non vide`, () => {
    pilot.scenes.forEach((sc, i) => {
      assert.ok(
        typeof sc.voice === 'string' && sc.voice.trim().length > 0,
        `"${id}" scène ${i} : voix vide ou absente`
      );
    });
  });

  test(`pilote "${id}" : chaque scène "choice" a au moins 2 choix`, () => {
    pilot.scenes.forEach((sc, i) => {
      if (sc.action !== 'choice') return;
      assert.ok(
        Array.isArray(sc.choices) && sc.choices.length >= 2,
        `"${id}" scène ${i} : moins de 2 choix (${(sc.choices || []).length})`
      );
    });
  });

  test(`pilote "${id}" : chaque scène "choice" a exactement une réponse correcte`, () => {
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

  test(`pilote "${id}" : atteint une scène "finish"`, () => {
    assert.ok(
      pilot.scenes.some((sc) => sc.action === 'finish'),
      `"${id}" n'a pas de scène "finish"`
    );
  });
}

summary('content-structure.test.js');
