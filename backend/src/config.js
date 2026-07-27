require("dotenv").config();

const settings = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://taskuser:taskpass@localhost:5432/tasknotifier",

  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || "CHANGE-ME-TO-A-LONG-RANDOM-VALUE",
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || "HS256",
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "1440", 10),

  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  PORT: parseInt(process.env.PORT || "8001", 10),

  // Requests per 15 minutes per IP, shared across /login, /security-question,
  // and /reset-password. Raised in tests so functional assertions don't
  // trip the limiter (rate limiting itself isn't what's under test there).
  AUTH_RATE_LIMIT: parseInt(process.env.AUTH_RATE_LIMIT || "20", 10),
};

module.exports = settings;
