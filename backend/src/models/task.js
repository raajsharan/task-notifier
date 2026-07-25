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
