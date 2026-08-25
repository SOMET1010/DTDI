'use strict';

// C1.3.1 — Tests de compatibilité avec docs/pass-academy-story-contract-v1.schema.json.
//
// Ne remplace pas tests/content-structure.test.js (qui reste la source de
// vérité sur le contrat interne action/good/voice). Ce fichier vérifie deux
// choses séparément :
//   1. des ASSERTIONS strictes sur ce que l'adaptateur DOIT produire
//      correctement aujourd'hui (structure mécanique : ids, mapping
//      action/voice/correct, bornes de tableaux du schéma) — un échec ici
//      est un vrai bug de l'adaptateur ou une régression ;
//   2. un RAPPORT (pas une assertion) des champs requis par le schéma que
//      le moteur ne fournit pas encore (priority, evidence, impact,
//      zeroReading, type des scènes 'next', visual manquant) — un manque ici
//      est un gap de contenu connu, documenté, pas un échec de build.
//
// Lancer : node tests/pedagogical-contract-compatibility.test.js

const assert = require('assert');
const { loadContentGlobals } = require('./lib/load-content');
const { test, summary } = require('./lib/mini-test');
const { toPedagogicalContract, validateAgainstSchema } = require('../tools/pedagogical-adapter');

const ctx = loadContentGlobals([
  'art/scenes-v13.js',
  'art/scenes-famille-b.js',
  'content/stories-v13.js',
  'content/famille-b-stories.js',
  'content/ejustice-pilot-v13.js',
  'content/narrative-pilots-v13.js',
  'content/basic-pilots-v13.js',
  'content/famille-b-pilots.js',
]);

function getPilot(id) {
  if (id === 'ejustice') return ctx.PASS_EJUSTICE_PILOT;
  return (ctx.PASS_NARRATIVE_PILOTS && ctx.PASS_NARRATIVE_PILOTS[id])
    || (ctx.PASS_BASIC_PILOTS && ctx.PASS_BASIC_PILOTS[id]);
}

const report = [];

for (const catalogEntry of ctx.PASS_STORIES) {
  const id = catalogEntry.id;
  const pilot = getPilot(id);

  test(`"${id}" : l'adaptateur produit un objet sans lever d'exception`, () => {
    assert.ok(pilot, `pilote introuvable pour "${id}" (déjà couvert par content-structure.test.js)`);
  });
  if (!pilot) continue;

  const sceneArtForStory = ctx.PASS_SCENES && ctx.PASS_SCENES[id];
  const adapted = toPedagogicalContract(catalogEntry, pilot, sceneArtForStory);
  const result = validateAgainstSchema(adapted);
  report.push({ id, ...result });

  test(`"${id}" adapté : aucune erreur structurelle (pas de "missing")`, () => {
    assert.deepStrictEqual(
      result.errors,
      [],
      `erreurs structurelles pour "${id}" : ${result.errors.join(' | ')}`
    );
  });

  test(`"${id}" adapté : id/character/skill/version mappés`, () => {
    assert.ok(adapted.id, `id manquant pour "${id}"`);
    assert.ok(adapted.character, `character manquant pour "${id}"`);
    assert.ok(adapted.skill, `skill manquant pour "${id}" (doit venir de PASS_STORIES)`);
    assert.strictEqual(adapted.version, '1.0');
  });

  test(`"${id}" adapté : chaque scène a un id et une voix`, () => {
    adapted.scenes.forEach((sc, i) => {
      assert.ok(sc.id, `scenes[${i}].id manquant pour "${id}"`);
      assert.ok(sc.voice, `scenes[${i}].voice manquant pour "${id}"`);
    });
  });

  test(`"${id}" adapté : chaque choix a id/previewVoice/correct, et correct est fidèle à "good"`, () => {
    pilot.scenes.forEach((sc, i) => {
      if (!Array.isArray(sc.choices)) return;
      const adaptedChoices = adapted.scenes[i].choices;
      sc.choices.forEach((c, j) => {
        assert.ok(adaptedChoices[j].id, `scenes[${i}].choices[${j}].id manquant pour "${id}"`);
        assert.strictEqual(adaptedChoices[j].previewVoice, c.voice);
        assert.strictEqual(adaptedChoices[j].correct, c.good === true);
      });
    });
  });
}

summary('pedagogical-contract-compatibility.test.js');

// --- Rapport (informationnel, ne fait pas échouer le test) ---

console.log('\n--- Écart au schéma docs/pass-academy-story-contract-v1.schema.json (gap connu, pas un échec) ---');
for (const r of report) {
  if (r.missing.length === 0) {
    console.log(`  ${r.id} : conforme au schéma`);
  } else {
    console.log(`  ${r.id} : ${r.missing.length} champ(s) requis manquant(s) — ${r.missing.join(', ')}`);
  }
}
const totalMissingTop = report.filter((r) => ['priority', 'zeroReading', 'evidence', 'impact']
  .some((k) => r.missing.includes(k))).length;
console.log(
  `\n${totalMissingTop}/${report.length} histoires n'ont pas encore de priority/zeroReading/evidence/impact ` +
  `renseignés dans le moteur (attendu : ces champs n'existent nulle part dans le contenu actuel, ce n'est ` +
  `pas un défaut de l'adaptateur — voir docs/PASS-ACADEMY-PEDAGOGICAL-CONTRACT-V1.md).`
);
