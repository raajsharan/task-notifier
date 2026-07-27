const express = require("express");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const {
  hashPassword,
  hashAnswer,
  verifyAnswer,
  authenticateUser,
  createAccessToken,
  getCurrentUser,
} = require("../auth");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Guessable-secret endpoints (password, security answer) get a stricter
// per-IP limit than the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many attempts. Please try again later." },
});

function serializeUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at, is_admin: user.isAdmin };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, security_question, security_answer } = req.body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(422).json({ detail: "A valid email is required" });
    }
    if (!password || password.length < 8) {
      return res.status(422).json({ detail: "Password must be at least 8 characters long" });
    }
    if (!security_question || !security_question.trim()) {
      return res.status(422).json({ detail: "A security question is required" });
    }
    if (!security_answer || !security_answer.trim()) {
      return res.status(422).json({ detail: "A security answer is required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ detail: "An account with that email already exists" });
    }

    const user = await User.create({
      email,
      hashedPassword: await hashPassword(password),
      securityQuestion: security_question.trim(),
      securityAnswerHash: await hashAnswer(security_answer),
    });
    res.status(201).json(serializeUser(user));
  })
);

// The frontend posts form-urlencoded data with a "username" field (email).
router.post(
  "/login",
  authLimiter,
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

// ---------- Self-service password reset (security question) ----------

router.get(
  "/security-question",
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = req.query.email;
    if (!email) {
      return res.status(422).json({ detail: "email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.securityQuestion) {
      return res.status(404).json({
        detail: "No security question is set up for that account. Ask an admin to reset your password instead.",
      });
    }

    res.json({ question: user.securityQuestion });
  })
);

router.post(
  "/reset-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, answer, new_password } = req.body || {};

    if (!new_password || new_password.length < 8) {
      return res.status(422).json({ detail: "Password must be at least 8 characters long" });
    }
    if (!answer) {
      return res.status(422).json({ detail: "An answer is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.securityAnswerHash) {
      return res.status(404).json({ detail: "No security question is set up for that account." });
    }

    const correct = await verifyAnswer(answer, user.securityAnswerHash);
    if (!correct) {
      return res.status(401).json({ detail: "Incorrect answer" });
    }

    user.hashedPassword = await hashPassword(new_password);
    await user.save();
    res.json({ reset: true });
  })
);

module.exports = router;
