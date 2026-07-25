const express = require("express");
const cors = require("cors");
const settings = require("./config");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors({ origin: settings.FRONTEND_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => {
  res.status(404).json({ detail: "Not found" });
});

// Catch-all — keeps error responses JSON instead of Express's default HTML
// page, so the frontend can always read err.response.data.detail.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: "Internal server error" });
});

module.exports = app;
