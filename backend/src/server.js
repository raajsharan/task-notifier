const app = require("./app");
const settings = require("./config");
const sequelize = require("./db");

async function start() {
  await sequelize.authenticate();
  // alter:true also adds new columns (e.g. Task.stage) to already-existing tables —
  // there's no separate migration tooling in this project.
  await sequelize.sync({ alter: true });
  app.listen(settings.PORT, () => {
    console.log(`Task Manager API listening on port ${settings.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
