const express = require("express");
const cors = require("cors");
const settings = require("./config");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();

app.use(cors({ origin: settings.FRONTEND_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
