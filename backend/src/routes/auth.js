const express = require("express");
const User = require("../models/user");
const { hashPassword, authenticateUser, createAccessToken, getCurrentUser } = require("../auth");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at };
}

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(422).json({ detail: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(422).json({ detail: "Password must be at least 8 characters long" });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ detail: "An account with that email already exists" });
  }

  const user = await User.create({ email, hashedPassword: await hashPassword(password) });
  res.status(201).json(serializeUser(user));
}));

// The frontend posts form-urlencoded data with a "username" field (email).
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const user = await authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ detail: "Incorrect email or password" });
    }
    const token = createAccessToken(user.email);
    res.json({ access_token: token, token_type: "bearer" });
  })
);

router.get("/me", getCurrentUser, (req, res) => {
  res.json(serializeUser(req.user));
});

module.exports = router;
