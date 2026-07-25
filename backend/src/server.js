const app = require("./app");
const settings = require("./config");
const sequelize = require("./db");

async function start() {
  await sequelize.authenticate();
  await sequelize.sync(); // auto-creates the users/tasks tables, matching the old create_all() behavior
  app.listen(settings.PORT, () => {
    console.log(`Task Manager API listening on port ${settings.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
