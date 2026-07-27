const Task = require("./models/task");

function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    status: task.status,
    stage: task.stage,
    priority: task.priority,
    tags: task.tags,
    recurrence: task.recurrence,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}

// Date-only arithmetic done in UTC so it never shifts a day depending on
// server timezone (dueDate is a DATEONLY "YYYY-MM-DD" string).
function nextDueDate(dueDateStr, recurrence) {
  const [year, month, day] = dueDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (recurrence === "daily") date.setUTCDate(date.getUTCDate() + 1);
  else if (recurrence === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  else if (recurrence === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);

  return date.toISOString().slice(0, 10);
}

async function createTask(data, ownerId) {
  const task = await Task.create({ ...data, ownerId });
  return serializeTask(task);
}

async function getTasks(ownerId) {
  const tasks = await Task.findAll({ where: { ownerId }, order: [["dueDate", "ASC"]] });
  return tasks.map(serializeTask);
}

async function getTaskRow(taskId, ownerId) {
  return Task.findOne({ where: { id: taskId, ownerId } });
}

async function updateTask(taskId, updates, ownerId) {
  const task = await getTaskRow(taskId, ownerId);
  if (!task) return null;

  const wasNotDone = task.status !== "done";

  const patch = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.due_date !== undefined) patch.dueDate = updates.due_date;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.stage !== undefined) patch.stage = updates.stage;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.recurrence !== undefined) patch.recurrence = updates.recurrence;

  await task.update(patch);

  if (wasNotDone && task.status === "done" && task.recurrence !== "none") {
    await Task.create({
      title: task.title,
      description: task.description,
      dueDate: nextDueDate(task.dueDate, task.recurrence),
      status: "pending",
      stage: "not_started",
      priority: task.priority,
      tags: task.tags,
      recurrence: task.recurrence,
      ownerId: task.ownerId,
    });
  }

  return serializeTask(task);
}

async function deleteTask(taskId, ownerId) {
  const task = await getTaskRow(taskId, ownerId);
  if (!task) return false;
  await task.destroy();
  return true;
}

module.exports = { createTask, getTasks, updateTask, deleteTask, serializeTask, nextDueDate };
