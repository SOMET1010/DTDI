'use strict';

// C1.3.1 — Adaptateur vers docs/pass-academy-story-contract-v1.schema.json.
//
// Décision : le moteur garde son contrat interne (action/good/voice) comme
// vocabulaire canonique — cf. narrative-engine.js, renderers.js, les 64
// tests de tests/content-structure.test.js. Ce module ne le remplace pas :
// il projette une histoire existante vers la forme du schéma pédagogique,
// pour permettre à un outillage externe (Content Studio, ChatGPT, revue
// pédagogique) de lire/valider le contenu sans que le moteur Android change.
//
// Règle stricte : ne jamais inventer de donnée. Un champ que le moteur ne
// connaît pas aujourd'hui (priority, zeroReading, evidence, impact,
// realAction, scenes[].type pour une scène 'next', scenes[].visual quand
// aucune illustration n'existe) est laissé absent, jamais deviné. Voir
// validateAgainstSchema() pour la liste précise de ce qui manque par
// histoire.

// scenes[].type est défini par le schéma comme le rôle pédagogique d'une
// scène (situation/problem/choice/practice/rule/real-action/success), une
// information que le moteur ne stocke pas. Seuls deux cas sont déductibles
// sans ambiguïté à partir de l'action du moteur :
// - une scène 'choice' n'a de sens, dans le schéma, que si type==='choice'
//   (le schéma l'exige structurellement) ;
// - une scène 'finish' clôt toujours l'histoire par une réussite, ce que le
//   schéma appelle 'success' (cf. doctrine, grammaire d'une histoire, étape
//   7 : "une scène de réussite clôt l'histoire").
// Une scène 'next' peut être situation, problem, practice ou rule selon le
// contexte narratif : ce n'est pas déductible mécaniquement, donc non
// mappé ici — cela requiert une relecture éditoriale, pas un adaptateur.
const ACTION_TO_TYPE = { choice: 'choice', finish: 'success' };

function adaptChoice(choice, sceneId, index) {
  return {
    id: `${sceneId}-choice-${index}`,
    visual: choice.visual,
    previewVoice: choice.voice,
    correct: choice.good === true,
  };
}

function adaptScene(scene, storyId, sceneArtForStory, index) {
  const id = `${storyId}-scene-${index}`;
  const adapted = { id, voice: scene.voice };

  const type = ACTION_TO_TYPE[scene.action];
  if (type) adapted.type = type;
  if (scene.action) adapted.action = scene.action;

  const visual = sceneArtForStory && sceneArtForStory[index];
  if (visual) adapted.visual = visual;

  if (Array.isArray(scene.choices)) {
    adapted.choices = scene.choices.map((c, i) => adaptChoice(c, id, i));
  }
  return adapted;
}

// catalogEntry : entrée de PASS_STORIES (id, character, skill, ...)
// pilot : objet scenes[] résolu par pilotFor(catalogEntry.id) dans le moteur
// sceneArtForStory : PASS_SCENES[catalogEntry.id] si présent, sinon absent
function toPedagogicalContract(catalogEntry, pilot, sceneArtForStory) {
  return {
    id: pilot.id,
    version: '1.0', // constante imposée par le schéma, ce n'est pas un contenu
    character: pilot.character || catalogEntry.character,
    skill: catalogEntry.skill,
    scenes: pilot.scenes.map((sc, i) => adaptScene(sc, pilot.id, sceneArtForStory, i)),
    // priority, zeroReading, evidence, impact : volontairement absents,
    // aucune donnée source fiable dans le moteur actuel pour les déduire.
  };
}

const REQUIRED_TOP = [
  'id', 'version', 'character', 'skill', 'priority', 'zeroReading', 'scenes', 'evidence', 'impact',
];
const SCENE_TYPES = ['situation', 'problem', 'choice', 'practice', 'rule', 'real-action', 'success'];
const SCENE_ACTIONS = ['next', 'choice', 'practice', 'launch-real-action', 'finish'];

// Vérifie une structure adaptée contre les contraintes du schéma JSON
// (implémentation ciblée, pas un moteur JSON Schema générique — évite une
// dépendance ajv pour un besoin aussi précis). Distingue :
// - missing  : champ requis par le schéma, absent car non déductible
//              aujourd'hui (gap de contenu, pas un bug)
// - errors   : valeur présente mais structurellement invalide (ça, c'est un
//              vrai défaut à corriger)
function validateAgainstSchema(obj) {
  const missing = [];
  const errors = [];

  for (const key of REQUIRED_TOP) {
    if (obj[key] === undefined) missing.push(key);
  }

  if (obj.version !== undefined && obj.version !== '1.0') {
    errors.push(`version doit être "1.0" (trouvé "${obj.version}")`);
  }

  if (!Array.isArray(obj.scenes)) {
    errors.push('scenes doit être un tableau');
    return { valid: false, missing, errors };
  }

  if (obj.scenes.length < 3 || obj.scenes.length > 8) {
    errors.push(`scenes doit contenir entre 3 et 8 éléments (trouvé ${obj.scenes.length})`);
  }

  obj.scenes.forEach((sc, i) => {
    if (!sc.id) missing.push(`scenes[${i}].id`);
    if (!sc.type) missing.push(`scenes[${i}].type`);
    else if (!SCENE_TYPES.includes(sc.type)) errors.push(`scenes[${i}].type "${sc.type}" invalide`);
    if (!sc.voice) missing.push(`scenes[${i}].voice`);
    if (!sc.visual) missing.push(`scenes[${i}].visual`);
    if (sc.action && !SCENE_ACTIONS.includes(sc.action)) {
      errors.push(`scenes[${i}].action "${sc.action}" invalide`);
    }
    if (sc.type === 'choice' && !Array.isArray(sc.choices)) missing.push(`scenes[${i}].choices`);

    if (Array.isArray(sc.choices)) {
      if (sc.choices.length < 2 || sc.choices.length > 3) {
        errors.push(`scenes[${i}].choices doit contenir 2 ou 3 éléments (trouvé ${sc.choices.length})`);
      }
      sc.choices.forEach((c, j) => {
        if (!c.id) missing.push(`scenes[${i}].choices[${j}].id`);
        if (!c.visual) missing.push(`scenes[${i}].choices[${j}].visual`);
        if (!c.previewVoice) missing.push(`scenes[${i}].choices[${j}].previewVoice`);
        if (typeof c.correct !== 'boolean') missing.push(`scenes[${i}].choices[${j}].correct`);
      });
    }
  });

  return { valid: missing.length === 0 && errors.length === 0, missing, errors };
}

module.exports = { toPedagogicalContract, validateAgainstSchema, ACTION_TO_TYPE, REQUIRED_TOP };
