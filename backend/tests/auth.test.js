const request = require("supertest");
const { app, sequelize, resetDb } = require("./testApp");

beforeAll(async () => {
  await sequelize.authenticate();
  await resetDb();
});

afterAll(async () => {
  await sequelize.close();
});

const VALID_USER = {
  email: "alice@example.com",
  password: "password123",
  security_question: "What is your favorite color?",
  security_answer: "Blue",
};

describe("POST /api/auth/register", () => {
  it("creates an account with valid input", async () => {
    const res = await request(app).post("/api/auth/register").send(VALID_USER);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: VALID_USER.email, is_admin: false });
    expect(res.body.id).toBeDefined();
  });

  it("rejects a duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(VALID_USER);
    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/already exists/i);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_USER, email: "not-an-email" });
    expect(res.status).toBe(422);
  });

  it("rejects a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_USER, email: "bob@example.com", password: "short" });
    expect(res.status).toBe(422);
    expect(res.body.detail).toMatch(/8 characters/i);
  });

  it("rejects a missing security question", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "carol@example.com", password: "password123", security_answer: "x" });
    expect(res.status).toBe(422);
    expect(res.body.detail).toMatch(/security question/i);
  });

  it("rejects a missing security answer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "dave@example.com",
      password: "password123",
      security_question: "Q?",
    });
    expect(res.status).toBe(422);
    expect(res.body.detail).toMatch(/security answer/i);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: VALID_USER.email, password: VALID_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.token_type).toBe("bearer");
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: VALID_USER.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: VALID_USER.email, password: VALID_USER.password });
    token = res.body.access_token;
  });

  it("returns the current user with a valid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(VALID_USER.email);
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("Self-service password reset", () => {
  it("returns the security question for an existing account", async () => {
    const res = await request(app)
      .get("/api/auth/security-question")
      .query({ email: VALID_USER.email });
    expect(res.status).toBe(200);
    expect(res.body.question).toBe(VALID_USER.security_question);
  });

  it("404s for an unknown email", async () => {
    const res = await request(app)
      .get("/api/auth/security-question")
      .query({ email: "nobody@example.com" });
    expect(res.status).toBe(404);
  });

  it("rejects an incorrect answer", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: VALID_USER.email,
      answer: "Red",
      new_password: "newpassword1",
    });
    expect(res.status).toBe(401);
  });

  it("resets the password with the correct answer (case/whitespace-insensitive)", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: VALID_USER.email,
      answer: "  BLUE  ",
      new_password: "newpassword1",
    });
    expect(res.status).toBe(200);
    expect(res.body.reset).toBe(true);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: VALID_USER.email, password: VALID_USER.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .type("form")
      .send({ username: VALID_USER.email, password: "newpassword1" });
    expect(newLogin.status).toBe(200);
  });
});
