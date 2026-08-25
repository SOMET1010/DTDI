'use strict';

// Micro-runner de tests, sans dépendance : chaque appel test() imprime son
// verdict et le script sort en code 1 si un test a échoué (utilisable en CI).

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   - ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL - ${name}`);
    console.error(`         ${err.message}`);
  }
}

function summary(label) {
  console.log(`\n${label} : ${passed} test(s) réussi(s), ${failed} échec(s).`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

module.exports = { test, summary };
