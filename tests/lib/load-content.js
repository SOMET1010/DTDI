'use strict';

// Charge les fichiers de contenu (app/src/main/assets/**) dans un bac à sable
// Node minimal, sans dépendance. Ces fichiers font `window.X = ...` : on fait
// pointer `window` sur le contexte lui-même pour que l'assignation soit visible.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'app', 'src', 'main', 'assets');

function loadContentGlobals(relativePaths) {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const relativePath of relativePaths) {
    const filePath = path.join(ASSETS_DIR, relativePath);
    const code = fs.readFileSync(filePath, 'utf8');
    new vm.Script(code, { filename: filePath }).runInContext(sandbox);
  }

  return sandbox;
}

module.exports = { loadContentGlobals, ASSETS_DIR };
