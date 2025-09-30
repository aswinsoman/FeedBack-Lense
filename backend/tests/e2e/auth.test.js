// backend/tests/e2e/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('E2E: Auth flow (register → login → me)', function () {
  this.timeout(30000);

  let mongod;
  let app;      // Express app exported by server.js
  let agent;    // supertest agent
  const userEmail = 'e2euser@example.com';
  const userPass = 'S3cretPass!';
  const userName = 'E2E Tester';
  let token;

  before(async () => {
    // 1) Spin up in-memory Mongo
    mongod = await MongoMemoryServer.create();

    // 2) Set env for server.js BEFORE requiring it (so it connects to in-memory Mongo)
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES = '1h';

    // 3) Require your server (it will call mongoose.connect() using the URI above)
    app = require('../../server'); // <- keep exactly this since you don't want server.js changed
    agent = request(app);

    // 4) Wait until Mongoose connection is open (server.js connected on import)
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('open', resolve);
        mongoose.connection.once('error', reject);
      });
    }
  });

  after(async () => {
    // Cleanup safely even if before() failed
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongod) await mongod.stop();
  });

  it('registers a new user and returns access token (201)', async () => {
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ name: userName, email: userEmail, password: userPass })
      .expect(201);

    expect(res.body).to.have.property('user');
    expect(res.body.user).to.include({ name: userName, email: userEmail });
    expect(res.body).to.have.property('accessToken').that.is.a('string');
    token = res.body.accessToken;
  });

  it('rejects duplicate registration (409/400/422)', async () => {
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ name: userName, email: userEmail, password: userPass })
      .expect(r => {
        if (![409, 400, 422].includes(r.status)) {
          throw new Error(`Unexpected status ${r.status}`);
        }
      });

    const msg = (res.body && (res.body.message || res.body.error)) || '';
    const code = res.body && res.body.code;
    expect(msg.toLowerCase()).to.include('email');
    if (code) expect(code).to.equal('EMAIL_TAKEN');
  });

  it('fails login with wrong password (401/400)', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: 'WrongPass' })
      .expect(r => {
        if (![401, 400].includes(r.status)) {
          throw new Error(`Unexpected status ${r.status}`);
        }
      });

    const msg = (res.body && (res.body.message || res.body.error)) || '';
    const code = res.body && res.body.code;
    expect(msg.toLowerCase()).to.match(/bad|invalid/);
    if (code) expect(code).to.equal('BAD_CREDENTIALS');
  });

  it('logs in successfully (200) and returns access token', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPass })
      .expect(200);

    expect(res.body).to.have.property('user');
    expect(res.body.user).to.include({ email: userEmail });
    expect(res.body).to.have.property('accessToken').that.is.a('string');
    token = res.body.accessToken;
  });

  it('rejects /me without token (401/403)', async () => {
    await agent.get('/api/v1/auth/me')
      .expect(r => {
        if (![401, 403].includes(r.status)) {
          throw new Error(`Unexpected status ${r.status}`);
        }
      });
  });

  it('returns current user from /me with Bearer token (200)', async () => {
    const res = await agent
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('email', userEmail);
    expect(res.body).to.have.property('name', userName);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('createdAt');
  });
});
