'use strict';

// Reads the files inside a GitHub Actions artifact zip (e.g. the
// evidence bundle .orchestrator/reviewer.mjs already uploads, now also
// carrying emulator screenshots). No caching layer here on purpose:
// artifacts are small and requests are infrequent — keep this simple
// until it's proven to need one.

const AdmZip = require('adm-zip');

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function contentTypeFor(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

async function listArtifactFiles(github, owner, repo, artifactId) {
  const buffer = await github.downloadArtifactZip(owner, repo, artifactId);
  const zip = new AdmZip(buffer);
  return zip
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map((entry) => ({
      path: entry.entryName,
      size: entry.header.size,
      contentType: contentTypeFor(entry.entryName),
    }));
}

async function readArtifactFile(github, owner, repo, artifactId, filePath) {
  const buffer = await github.downloadArtifactZip(owner, repo, artifactId);
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry(filePath);
  if (!entry || entry.isDirectory) return null;
  return { data: entry.getData(), contentType: contentTypeFor(filePath) };
}

module.exports = { listArtifactFiles, readArtifactFile, contentTypeFor };
