'use strict';

// Thin wrapper around node's built-in SQLite (node:sqlite, stable since
// Node 22.5+) so the rest of the codebase never touches the driver
// directly. Kept dependency-free on purpose: the cockpit's own footprint
// must stay small and auditable.

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function openDatabase(filePath) {
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA foreign_keys = ON;');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  return wrap(db);
}

function wrap(db) {
  return {
    raw: db,
    run(sql, params = {}) {
      const stmt = db.prepare(sql);
      return stmt.run(params);
    },
    get(sql, params = {}) {
      const stmt = db.prepare(sql);
      return stmt.get(params) ?? null;
    },
    all(sql, params = {}) {
      const stmt = db.prepare(sql);
      return stmt.all(params);
    },
    transaction(fn) {
      db.exec('BEGIN');
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    close() {
      db.close();
    },
  };
}

module.exports = { openDatabase };
