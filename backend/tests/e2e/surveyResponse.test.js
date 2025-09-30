const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('E2E: submit survey response', function () {
  this.timeout(30000);

  let mongod, agent, app;

  before(async () => {
    // 1) Start in-memory Mongo and expose URI to the app
    mongod = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongod.getUri();

    // 2) Require the app AFTER setting envs (so app connects once using MONGO_URI)
    // IMPORTANT: app file should export the Express app (not start listening automatically)
    app = require('../../server'); // or your actual path exporting the Express app
    agent = request(app);

    // 3) Optionally wait until connected
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('open', resolve);
        mongoose.connection.once('error', reject);
      });
    }

    // 4) Seed DB as needed here (using your models)...
  });

  after(async () => {
    // Guard: only drop if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongod) await mongod.stop();
  });

  it('submits a response and returns 201 with saved data', async () => {
    // ... your test body ...
  });

  it('rejects missing fields with 400', async () => {
    // ... your test body ...
  });
});
