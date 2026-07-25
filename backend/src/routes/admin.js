const express = require("express");
const User = require("../models/user");
const { hashPassword, getCurrentUser, requireAdmin } = require("../auth");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

router.use(getCurrentUser, requireAdmin);

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.isAdmin,
  };
}

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.findAll({ order: [["id", "ASC"]] });
    res.json(users.map(serializeUser));
  })
);

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    res.json(serializeUser(user));
  })
);

router.post(
  "/users/:id/reset-password",
  asyncHandler(async (req, res) => {
    const { new_password } = req.body || {};
    if (!new_password || new_password.length < 8) {
      return res.status(422).json({ detail: "Password must be at least 8 characters long" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    user.hashedPassword = await hashPassword(new_password);
    await user.save();
    res.json({ reset: true });
  })
);

module.exports = router;
