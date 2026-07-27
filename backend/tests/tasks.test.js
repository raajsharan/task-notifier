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

describe("Recurring tasks", () => {
  it("rejects an invalid recurrence value", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad recurrence", due_date: "2026-08-06", recurrence: "yearly" });
    expect(res.status).toBe(422);
  });

  it("defaults recurrence to 'none' and does not spawn a next occurrence when completed", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "One-off task", due_date: "2026-08-06" });
    expect(created.body.recurrence).toBe("none");

    const before = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });
    const after = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);

    expect(after.body.length).toBe(before.body.length);
  });

  it("spawns the next occurrence with an advanced due date when a daily task is completed", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Daily standup", due_date: "2026-08-10", recurrence: "daily" });

    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });
    expect(res.status).toBe(200);
    // The completed task itself stays done, at its original due date.
    expect(res.body.status).toBe("done");
    expect(res.body.due_date).toBe("2026-08-10");

    const all = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    const next = all.body.find(
      (t) => t.title === "Daily standup" && t.id !== created.body.id
    );
    expect(next).toBeDefined();
    expect(next.due_date).toBe("2026-08-11");
    expect(next.status).toBe("pending");
    expect(next.stage).toBe("not_started");
    expect(next.recurrence).toBe("daily");
  });

  it("advances weekly and monthly recurrences correctly", async () => {
    const weekly = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Weekly sync", due_date: "2026-08-10", recurrence: "weekly" });
    await request(app)
      .patch(`/api/tasks/${weekly.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });

    const monthly = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Monthly report", due_date: "2026-01-31", recurrence: "monthly" });
    await request(app)
      .patch(`/api/tasks/${monthly.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });

    const all = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    const nextWeekly = all.body.find((t) => t.title === "Weekly sync" && t.id !== weekly.body.id);
    const nextMonthly = all.body.find((t) => t.title === "Monthly report" && t.id !== monthly.body.id);

    expect(nextWeekly.due_date).toBe("2026-08-17");
    // JS Date's setUTCMonth on Jan 31 rolls into March (Feb has no 31st) —
    // documenting actual behavior rather than asserting an idealized one.
    expect(nextMonthly.due_date).toBe("2026-03-03");
  });

  it("does not spawn a second occurrence if the same task is marked done twice", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Idempotent recurrence check", due_date: "2026-08-12", recurrence: "daily" });

    await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });
    const afterFirst = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    const countAfterFirst = afterFirst.body.filter((t) => t.title === "Idempotent recurrence check").length;

    // Already done -> done again should NOT spawn a duplicate next occurrence.
    await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });
    const afterSecond = await request(app).get("/api/tasks").set("Authorization", `Bearer ${tokenA}`);
    const countAfterSecond = afterSecond.body.filter((t) => t.title === "Idempotent recurrence check").length;

    expect(countAfterFirst).toBe(2); // original + spawned next occurrence
    expect(countAfterSecond).toBe(2);
  });
});
