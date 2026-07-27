const express = require("express");
const { getCurrentUser } = require("../auth");
const crud = require("../crud");
const asyncHandler = require("../asyncHandler");

const router = express.Router();
router.use(getCurrentUser);

const VALID_STATUSES = ["pending", "done"];
const VALID_STAGES = ["not_started", "in_progress", "on_hold", "completed"];
const VALID_PRIORITIES = ["low", "medium", "high"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

// Returns { tags } on success or { error } on failure. Trims, drops empties,
// dedupes, and caps count/length so a client can't stuff arbitrary data in.
function sanitizeTags(tags) {
  if (!Array.isArray(tags)) {
    return { error: "tags must be an array of strings" };
  }
  if (tags.some((t) => typeof t !== "string")) {
    return { error: "tags must be an array of strings" };
  }

  const cleaned = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];

  if (cleaned.length > MAX_TAGS) {
    return { error: `A task can have at most ${MAX_TAGS} tags` };
  }
  if (cleaned.some((t) => t.length > MAX_TAG_LENGTH)) {
    return { error: `Each tag must be at most ${MAX_TAG_LENGTH} characters` };
  }

  return { tags: cleaned };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await crud.getTasks(req.user.id);
    res.json(tasks);
  })
);

router.post("/", asyncHandler(async (req, res) => {
  const { title, description, due_date, status, stage, priority, tags } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(422).json({ detail: "title is required" });
  }
  if (!due_date || !DATE_RE.test(due_date)) {
    return res.status(422).json({ detail: "due_date must be a YYYY-MM-DD date" });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(422).json({ detail: "status must be pending or done" });
  }
  if (stage && !VALID_STAGES.includes(stage)) {
    return res.status(422).json({ detail: "stage must be one of: " + VALID_STAGES.join(", ") });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(422).json({ detail: "priority must be one of: " + VALID_PRIORITIES.join(", ") });
  }

  let cleanTags = [];
  if (tags !== undefined) {
    const result = sanitizeTags(tags);
    if (result.error) {
      return res.status(422).json({ detail: result.error });
    }
    cleanTags = result.tags;
  }

  const task = await crud.createTask(
    {
      title,
      description: description || "",
      dueDate: due_date,
      status: status || "pending",
      stage: stage || "not_started",
      priority: priority || "medium",
      tags: cleanTags,
    },
    req.user.id
  );
  res.status(201).json(task);
}));

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { due_date, status, stage, priority, tags } = req.body || {};
    const patch = { ...req.body };

    if (due_date !== undefined && !DATE_RE.test(due_date)) {
      return res.status(422).json({ detail: "due_date must be a YYYY-MM-DD date" });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(422).json({ detail: "status must be pending or done" });
    }
    if (stage !== undefined && !VALID_STAGES.includes(stage)) {
      return res.status(422).json({ detail: "stage must be one of: " + VALID_STAGES.join(", ") });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(422).json({ detail: "priority must be one of: " + VALID_PRIORITIES.join(", ") });
    }
    if (tags !== undefined) {
      const result = sanitizeTags(tags);
      if (result.error) {
        return res.status(422).json({ detail: result.error });
      }
      patch.tags = result.tags;
    }

    const updated = await crud.updateTask(req.params.id, patch, req.user.id);
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
