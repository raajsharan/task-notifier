const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./user");

const Task = sequelize.define(
  "Task",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: "due_date" },
    status: {
      type: DataTypes.ENUM("pending", "done"),
      allowNull: false,
      defaultValue: "pending",
    },
    // Independent of `status` — drives the Kanban board view only.
    stage: {
      type: DataTypes.ENUM("not_started", "in_progress", "on_hold", "completed"),
      allowNull: false,
      defaultValue: "not_started",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    // On completion (status -> done), a task with recurrence !== "none"
    // spawns its next occurrence (see crud.updateTask) instead of relying
    // on a background scheduler pre-generating future instances.
    recurrence: {
      type: DataTypes.ENUM("none", "daily", "weekly", "monthly"),
      allowNull: false,
      defaultValue: "none",
    },
    ownerId: { type: DataTypes.INTEGER, allowNull: false, field: "owner_id" },
  },
  {
    tableName: "tasks",
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Task.belongsTo(User, { foreignKey: "ownerId", as: "owner", onDelete: "CASCADE" });
User.hasMany(Task, { foreignKey: "ownerId", as: "tasks", onDelete: "CASCADE" });

module.exports = Task;
