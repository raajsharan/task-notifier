const Task = require("./models/task");

function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    status: task.status,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
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

  const patch = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.due_date !== undefined) patch.dueDate = updates.due_date;
  if (updates.status !== undefined) patch.status = updates.status;

  await task.update(patch);
  return serializeTask(task);
}

async function deleteTask(taskId, ownerId) {
  const task = await getTaskRow(taskId, ownerId);
  if (!task) return false;
  await task.destroy();
  return true;
}

module.exports = { createTask, getTasks, updateTask, deleteTask, serializeTask };
