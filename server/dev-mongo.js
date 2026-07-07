// Spins up a real local MongoDB instance for development, so you don't need
// an Atlas account just to run the server locally. Not used in production —
// production points MONGODB_URI at a real Atlas cluster instead.
// Usage: node dev-mongo.js, then in another terminal:
//   MONGODB_URI="mongodb://127.0.0.1:27117/volta" npm start
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({ instance: { port: 27117, dbName: 'volta' } });
  console.log(`Local MongoDB running at ${mongod.getUri()}volta`);
  console.log('Run in another terminal: MONGODB_URI="' + mongod.getUri() + 'volta" npm start');
  process.on('SIGTERM', async () => { await mongod.stop(); process.exit(0); });
  process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
})();
