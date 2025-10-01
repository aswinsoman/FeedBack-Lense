const request = require("supertest");
const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let app;
let mongod;

describe("E2E Tests: Authentication (F2)", function () {
  this.timeout(30000); // increase timeout for MongoMemoryServer
  const user = { name: "Movini", email: "movini@test.com", password: "Pass1234" };
  let token;

  before(async () => {
    // Start in-memory MongoDB
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "testsecret";
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    


    delete require.cache[require.resolve("../backend/server")];
    // Import app AFTER setting MONGO_URI
    app = require("../backend/server"); 
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongod) await mongod.stop();
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(user)
      .expect(201);

    expect(res.body).to.have.property("user");
    expect(res.body.user).to.include({ email: user.email });
    expect(res.body).to.have.property("accessToken");
  });

  it("should reject duplicate registration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(user)
      .expect(409);
    
    expect(res.body).to.have.property("error", "Email already in use");
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(res.body).to.have.property("accessToken");
    token = res.body.accessToken;
  });

  it("should reject login with wrong password", async () => {
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrongpassword" })
      .expect(401);
  });

  it("should get profile with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property("email", user.email);
  });

  it("should reject profile access without token", async () => {
    await request(app).get("/api/v1/auth/me").expect(401);
  });
});
