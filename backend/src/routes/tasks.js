const express = require("express");
const { getCurrentUser } = require("../auth");
const crud = require("../crud");
const asyncHandler = require("../asyncHandler");

const router = express.Router();
router.use(getCurrentUser);

const VALID_STATUSES = ["pending", "done"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await crud.getTasks(req.user.id);
    res.json(tasks);
  })
);

router.post("/", asyncHandler(async (req, res) => {
  const { title, description, due_date, status } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(422).json({ detail: "title is required" });
  }
  if (!due_date || !DATE_RE.test(due_date)) {
    return res.status(422).json({ detail: "due_date must be a YYYY-MM-DD date" });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(422).json({ detail: "status must be pending or done" });
  }

  const task = await crud.createTask(
    {
      title,
      description: description || "",
      dueDate: due_date,
      status: status || "pending",
    },
    req.user.id
  );
  res.status(201).json(task);
}));

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { due_date, status } = req.body || {};

    if (due_date !== undefined && !DATE_RE.test(due_date)) {
      return res.status(422).json({ detail: "due_date must be a YYYY-MM-DD date" });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(422).json({ detail: "status must be pending or done" });
    }

    const updated = await crud.updateTask(req.params.id, req.body || {}, req.user.id);
    if (!updated) {
      return res.status(404).json({ detail: "Task not found" });
    }
    res.json(updated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const ok = await crud.deleteTask(req.params.id, req.user.id);
    if (!ok) {
      return res.status(404).json({ detail: "Task not found" });
    }
    res.json({ deleted: true });
  })
);

module.exports = router;
