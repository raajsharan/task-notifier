const { Sequelize } = require("sequelize");
const settings = require("./config");

const sequelize = new Sequelize(settings.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

module.exports = sequelize;
