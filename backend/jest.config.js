module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/jest.setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  // Serial: all test files share one Postgres test database.
  maxWorkers: 1,
  testTimeout: 15000,
};
