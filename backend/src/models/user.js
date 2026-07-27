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
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_admin",
    },
    // Nullable so existing accounts (registered before this feature) don't
    // break on schema alter — those users just can't self-service reset
    // until an admin resets their password once.
    securityQuestion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "security_question",
    },
    securityAnswerHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "security_answer_hash",
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
