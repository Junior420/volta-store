// MongoDB-backed database. Each "collection" (products/specs/orders) is
// stored as a single document — {_id: name, data: <the array/object>} — so
// the rest of the app can keep reading/writing whole collections at once,
// same as when this was JSON files on disk. Free-tier friendly: no local
// persistent disk needed, just a MongoDB Atlas free (M0) cluster.
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'volta';
const SEED_DIR = path.join(__dirname, 'seed');

if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set. Set it to your MongoDB Atlas connection string.');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let dbPromise = null;

function getDb() {
  if (!dbPromise) dbPromise = client.connect().then(() => client.db(DB_NAME));
  return dbPromise;
}

function collection() {
  return getDb().then(db => db.collection('store'));
}

// Copy seed data on first boot so the store starts with the full catalog.
async function ensureSeeded(name, fallback) {
  const col = await collection();
  const existing = await col.findOne({ _id: name });
  if (existing) return;
  const seedFile = path.join(SEED_DIR, name + '.json');
  const initial = fs.existsSync(seedFile) ? JSON.parse(fs.readFileSync(seedFile, 'utf8')) : fallback;
  await col.insertOne({ _id: name, data: initial });
}

async function read(name) {
  const col = await collection();
  const doc = await col.findOne({ _id: name });
  return doc ? doc.data : null;
}

async function write(name, value) {
  const col = await collection();
  await col.updateOne({ _id: name }, { $set: { data: value } }, { upsert: true });
}

function nextId(items) {
  return items.reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
}

module.exports = { ensureSeeded, read, write, nextId };
