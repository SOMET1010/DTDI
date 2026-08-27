'use strict';

// Charge l'app réelle (index.html + tous les <script src> qu'il référence,
// dans l'ordre où un navigateur les exécuterait) dans un DOM minimal simulé
// via le module vm de Node. L'ordre des scripts est LU depuis index.html,
// jamais recopié à la main : il ne peut pas diverger de l'app réelle.
//
// Limite assumée : ce DOM n'a pas de moteur de rendu CSS. Il peut prouver
// qu'un parcours JS ne lève pas d'exception, pas qu'un élément est
// visuellement masqué à l'écran.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'app', 'src', 'main', 'assets');

function makeEl() {
  const e = {
    style: {},
    children: [],
    innerHTML: '',
    onclick: null,
    dataset: {},
    appendChild(child) { this.children.push(child); return child; },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  e._classes = new Set();
  e.classList = {
    add: (c) => { e._classes.add(c); },
    remove: (c) => { e._classes.delete(c); },
    toggle: (c) => (e._classes.has(c) ? (e._classes.delete(c), false) : (e._classes.add(c), true)),
    contains: (c) => e._classes.has(c),
  };
  return e;
}

function loadApp() {
  const html = fs.readFileSync(path.join(ASSETS_DIR, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  if (scripts.length === 0) throw new Error('aucun <script src> trouvé dans index.html');

  const elements = {};
  const sandbox = {
    console,
    localStorage: (() => {
      const store = {};
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
      };
    })(),
    speechSynthesis: { cancel() {}, speak() {} },
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    document: {
      getElementById(id) {
        if (!elements[id]) elements[id] = makeEl();
        return elements[id];
      },
      createElement() { return makeEl(); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
    Math,
    JSON,
    Object,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const src of scripts) {
    const code = fs.readFileSync(path.join(ASSETS_DIR, src), 'utf8');
    new vm.Script(code, { filename: src }).runInContext(sandbox);
  }

  return { sandbox, elements };
}

// Sonde de test : expose activePilot/pilotIndex (moteur partagé des 9
// histoires) et tnpIndex (moteur dédié LOT C2.1 de "phone-photo") — des
// `let` internes au bundle, invisibles depuis l'hôte — sans modifier les
// fichiers livrés.
function probe(sandbox) {
  new vm.Script('function __probe(){ return { activePilot, pilotIndex, tnpIndex: (typeof tnpIndex !== "undefined" ? tnpIndex : undefined) }; }').runInContext(sandbox);
  return () => sandbox.__probe();
}

module.exports = { loadApp, probe, ASSETS_DIR };
