const request = require("supertest");
const { app, sequelize, resetDb } = require("./testApp");

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

let tokenA;
let tokenB;

beforeAll(async () => {
  await sequelize.authenticate();
  await resetDb();
  tokenA = await registerAndLogin("owner-a@example.com");
  tokenB = await registerAndLogin("owner-b@example.com");
});

afterAll(async () => {
  await sequelize.close();
});

describe("Task auth boundary", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task with valid input", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Write report", due_date: "2026-08-01" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Write report",
      description: "",
      due_date: "2026-08-01",
      status: "pending",
      stage: "not_started",
      priority: "medium",
      tags: [],
    });
  });

  it("rejects a missing title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ due_date: "2026-08-01" });
    expect(res.status).toBe(422);
  });

  it("rejects a malformed due_date", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad date", due_date: "08/01/2026" });
    expect(res.status).toBe(422);
  });

  it("rejects an invalid status", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad status", due_date: "2026-08-01", status: "whatever" });
    expect(res.status).toBe(422);
  });

  it("rejects an invalid priority", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad priority", due_date: "2026-08-01", priority: "urgent" });
    expect(res.status).toBe(422);
  });

  it("accepts a valid priority and tags, trimming/deduping tags", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Prioritized task",
        due_date: "2026-08-01",
        priority: "high",
        tags: [" work ", "urgent", "work", ""],
      });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe("high");
    expect(res.body.tags).toEqual(["work", "urgent"]);
  });

  it("rejects tags that aren't an array of strings", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad tags", due_date: "2026-08-01", tags: "not-an-array" });
    expect(res.status).toBe(422);
  });

  it("rejects more than 10 tags", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Too many tags",
        due_date: "2026-08-01",
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/tasks — ownership isolation", () => {
  it("only returns the requesting user's tasks", async () => {
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "User B's task", due_date: "2026-08-02" });

    const resA = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    const resB = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenB}`);

    expect(resA.body.every((t) => t.title !== "User B's task")).toBe(true);
    expect(resB.body.some((t) => t.title === "User B's task")).toBe(true);
  });
});

describe("PATCH /api/tasks/:id", () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "To be edited", due_date: "2026-08-03" });
    taskId = res.body.id;
  });

  it("updates status and stage", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done", stage: "completed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
    expect(res.body.stage).toBe("completed");
  });

  it("404s when another user tries to update it", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ status: "pending" });
    expect(res.status).toBe(404);
  });

  it("404s for a nonexistent task", async () => {
    const res = await request(app)
      .patch("/api/tasks/999999")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "pending" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid stage", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ stage: "bogus" });
    expect(res.status).toBe(422);
  });

  it("updates priority and tags", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ priority: "low", tags: ["review", "later"] });
    expect(res.status).toBe(200);
    expect(res.body.priority).toBe("low");
    expect(res.body.tags).toEqual(["review", "later"]);
  });

  it("rejects an invalid priority on update", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ priority: "urgent" });
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes a task and 404s on second delete", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "To be deleted", due_date: "2026-08-04" });
    const taskId = created.body.id;

    const first = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(first.status).toBe(200);
    expect(first.body.deleted).toBe(true);

    const second = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(second.status).toBe(404);
  });

  it("404s when another user tries to delete it", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Owned by A", due_date: "2026-08-05" });

    const res = await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});
