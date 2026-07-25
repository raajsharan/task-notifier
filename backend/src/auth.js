const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const settings = require("./config");
const User = require("./models/user");

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function createAccessToken(subjectEmail, expiresMinutes) {
  const minutes = expiresMinutes || settings.ACCESS_TOKEN_EXPIRE_MINUTES;
  return jwt.sign({ sub: subjectEmail }, settings.JWT_SECRET_KEY, {
    algorithm: settings.JWT_ALGORITHM,
    expiresIn: minutes * 60,
  });
}

async function authenticateUser(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) return null;
  return user;
}

// Express middleware — verifies the Bearer JWT and attaches req.user.
async function getCurrentUser(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  try {
    const payload = jwt.verify(token, settings.JWT_SECRET_KEY, {
      algorithms: [settings.JWT_ALGORITHM],
    });
    const email = payload.sub;
    if (!email) {
      return res.status(401).json({ detail: "Could not validate credentials" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: "Could not validate credentials" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  authenticateUser,
  getCurrentUser,
};
