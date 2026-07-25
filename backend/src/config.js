require("dotenv").config();

const settings = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://taskuser:taskpass@localhost:5432/tasknotifier",

  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || "CHANGE-ME-TO-A-LONG-RANDOM-VALUE",
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || "HS256",
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "1440", 10),

  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  PORT: parseInt(process.env.PORT || "8000", 10),
};

module.exports = settings;
