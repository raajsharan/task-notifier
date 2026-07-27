const sequelize = require("../src/db");
const app = require("../src/app");

// force:true drops and recreates every table — fine for a throwaway test DB,
// never point TEST_DATABASE_URL at anything you care about.
async function resetDb() {
  await sequelize.sync({ force: true });
}

module.exports = { app, sequelize, resetDb };
