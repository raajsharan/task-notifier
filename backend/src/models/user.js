const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    hashedPassword: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "hashed_password",
    },
  },
  {
    tableName: "users",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = User;
