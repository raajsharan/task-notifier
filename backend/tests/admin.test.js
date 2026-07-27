const request = require("supertest");
const { app, sequelize, resetDb } = require("./testApp");
const User = require("../src/models/user");

async function registerAndLogin(email) {
  await request(app).post("/api/auth/register").send({
    email,
    password: "password123",
    security_question: "Q?",
    security_answer: "A",
  });
  const res = await request(app)
    .post("/api/auth/login")
    .type("form")
    .send({ username: email, password: "password123" });
  return res.body.access_token;
}

let adminToken;
let userToken;
let plainUserId;

beforeAll(async () => {
  await sequelize.authenticate();
  await resetDb();

  adminToken = await registerAndLogin("admin@example.com");
  userToken = await registerAndLogin("plainuser@example.com");

  const admin = await User.findOne({ where: { email: "admin@example.com" } });
  admin.isAdmin = true;
  await admin.save();
  // Re-login so the JWT correctly reflects... (isAdmin isn't in the token
  // itself, it's looked up per-request, so no re-login is actually needed —
  // kept here as documentation of that fact.)

  const plainUser = await User.findOne({ where: { email: "plainuser@example.com" } });
  plainUserId = plainUser.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Admin authorization boundary", () => {
  it("rejects a non-admin on GET /api/admin/users", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("rejects a non-admin on the reset-password route", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${plainUserId}/reset-password`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ new_password: "hacked123" });
    expect(res.status).toBe(403);
  });

  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("Admin: list and inspect users", () => {
  it("lists all users", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((u) => u.email === "admin@example.com" && u.is_admin === true)).toBe(true);
    expect(res.body.some((u) => u.email === "plainuser@example.com" && u.is_admin === false)).toBe(true);
  });

  it("gets a single user by id", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${plainUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("plainuser@example.com");
  });

  it("404s for a nonexistent user id", async () => {
    const res = await request(app)
      .get("/api/admin/users/999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe("Admin: reset another user's password", () => {
  it("resets the password and the new one works for login", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${plainUserId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ new_password: "adminresetpass1" });
    expect(res.status).toBe(200);
    expect(res.body.reset).toBe(true);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: "plainuser@example.com", password: "password123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: "plainuser@example.com", password: "adminresetpass1" });
    expect(newLogin.status).toBe(200);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${plainUserId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ new_password: "short" });
    expect(res.status).toBe(422);
  });
});
