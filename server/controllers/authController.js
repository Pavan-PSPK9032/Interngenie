const User = require("../models/User");
const { generateToken, hashPassword, verifyPassword, sanitizeUser } = require("../utils/helpers");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, role, companyId } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({
      email,
      passwordHash: hashPassword(password),
      name,
      role,
      companyId: role === "COMPANY" ? companyId : undefined,
      isVerified: role === "STUDENT",
      isApproved: true,
      emailVerified: true,
      profileCompleted: role === "STUDENT" ? 20 : role === "COMPANY" ? 30 : 100,
    });

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) { next(err); }
};
