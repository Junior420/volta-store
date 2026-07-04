// Tiny JSON-file database. Each collection is one file in DATA_DIR.
// Writes are atomic (write temp file, then rename) so a crash can't corrupt data.
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SEED_DIR = path.join(__dirname, 'seed');

fs.mkdirSync(DATA_DIR, { recursive: true });

function fileFor(name) {
  return path.join(DATA_DIR, name + '.json');
}

// Copy seed data on first boot so the store starts with the full catalog.
function ensureSeeded(name, fallback) {
  const file = fileFor(name);
  if (fs.existsSync(file)) return;
  const seedFile = path.join(SEED_DIR, name + '.json');
  const initial = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, 'utf8') : JSON.stringify(fallback, null, 2);
  fs.writeFileSync(file, initial);
}

function read(name) {
  return JSON.parse(fs.readFileSync(fileFor(name), 'utf8'));
}

function write(name, value) {
  const file = fileFor(name);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

function nextId(items) {
  return items.reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
}

module.exports = { ensureSeeded, read, write, nextId, DATA_DIR };
