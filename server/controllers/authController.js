const crypto = require("crypto");
const User = require("../models/User");
const Token = require("../models/Token");
const { parseResume } = require("../utils/resumeParser");
const { generateToken, hashPassword, verifyPassword, sanitizeUser, generateResetToken, generateVerificationToken } = require("../utils/helpers");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../utils/email");

exports.registerWithResume = async (req, res, next) => {
  try {
    const { resumeText, resumeData, additionalFields, password } = req.body;
    
    if (!resumeText || !resumeData) {
      return res.status(400).json({ error: "Resume data is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const parsed = typeof resumeData === "string" ? parseResume(resumeText) : resumeData;
    const personal = parsed.personal || {};
    const email = personal.email || additionalFields?.email;
    const name = personal.name || additionalFields?.name;

    if (!email || !name) {
      return res.status(400).json({ 
        error: "Email and name are required",
        missing: { email: !email, name: !name }
      });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({
      email,
      passwordHash: hashPassword(password),
      name,
      role: "STUDENT",
      isVerified: true,
      isApproved: true,
      emailVerified: true,
      phone: personal.phone || "",
      address: personal.address || "",
      linkedin: personal.linkedin || "",
      github: personal.github || "",
      portfolio: personal.portfolio || "",
      dob: personal.dob || "",
      gender: personal.gender || "",
      college: parsed.education?.[0]?.institution || "",
      degree: parsed.education?.[0]?.degree || "",
      branch: parsed.education?.[0]?.branch || "",
      cgpa: parsed.education?.[0]?.cgpa || 0,
      graduationYear: parsed.education?.[0]?.endYear || 0,
      skills: [...(parsed.skills || []).map((s) => s.name), ...(parsed.softSkills || []).map((s) => s.name)],
      extractedSkills: [...(parsed.skills || []).map((s) => s.name), ...(parsed.softSkills || []).map((s) => s.name)],
      resumeText,
      resumeData: parsed,
      interests: parsed.interests || [],
      preferredLocations: additionalFields?.preferredLocation ? [additionalFields.preferredLocation] : [],
      projects: parsed.projects || [],
      experience: parsed.experience || [],
      certifications: parsed.certifications || [],
      languages: parsed.languages || [],
      achievements: parsed.achievements || [],
      courses: parsed.courses || [],
      careerObjective: parsed.summary || "",
      profileCompleted: 80,
    });

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Account uses Google sign-in. Please login with Google." });
    }

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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });

    if (user) {
      const rawToken = generateResetToken();
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      await Token.deleteMany({ userId: user._id.toString(), type: "password_reset" });

      await Token.create({
        userId: user._id.toString(),
        token: hashedToken,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const tokenDoc = await Token.findOne({
      token: hashedToken,
      type: "password_reset",
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.passwordHash = hashPassword(password);
    await user.save();

    tokenDoc.used = true;
    await tokenDoc.save();

    return res.json({ message: "Password has been reset successfully" });
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const tokenDoc = await Token.findOne({
      token: hashedToken,
      type: "email_verification",
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.emailVerified = true;
    user.isVerified = true;
    await user.save();

    tokenDoc.used = true;
    await tokenDoc.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) { next(err); }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { email, name, avatarUrl, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      if (name && !user.name) {
        user.name = name;
      }
      await user.save();
    } else {
      const randomPassword = crypto.randomBytes(30).toString("hex");
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        googleId: googleId || undefined,
        avatarUrl: avatarUrl || undefined,
        passwordHash: hashPassword(randomPassword),
        role: "STUDENT",
        isVerified: true,
        isApproved: true,
        emailVerified: true,
        profileCompleted: 20,
      });
    }

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) { next(err); }
};
