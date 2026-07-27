// Runs before any test file's modules are required, so config.js picks up
// these values instead of backend/.env (dotenv.config() never overrides
// already-set env vars).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgres://taskuser:Password@1234@localhost:5432/tasknotifier_test";
process.env.JWT_SECRET_KEY = "test-secret-key-not-for-production";
process.env.JWT_ALGORITHM = "HS256";
process.env.ACCESS_TOKEN_EXPIRE_MINUTES = "1440";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.PORT = "0";
// Rate limiting isn't what's under test here — raise the budget so repeated
// login/reset calls across one test file don't trip the limiter.
process.env.AUTH_RATE_LIMIT = "1000";
