const crypto = require("crypto");
const User = require("../models/User");
const Token = require("../models/Token");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const Notification = require("../models/Notification");
const { parseResume } = require("../utils/resumeParser");
const { checkATS } = require("../utils/atsChecker");
const { computeProfileCompleteness } = require("../utils/profileCompleteness");
const { generateToken, hashPassword, verifyPassword, sanitizeUser, generateResetToken, generateVerificationToken } = require("../utils/helpers");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../utils/email");
const { generateUniqueUsername } = require("../utils/username");

function inferCertCategory(name) {
  const n = (name || "").toLowerCase();
  if (/ai|machine learning|deep learning|nlp|computer vision|data science|tensorflow|pytorch|gen ?ai/.test(n)) return "AI";
  if (/cloud|aws|azure|gcp|devops|docker|kubernetes/.test(n)) return "Cloud";
  if (/cyber|security|ethical|hacking|penetration/.test(n)) return "Cybersecurity";
  if (/data|sql|analytics|statistics|excel|power ?bi|tableau/.test(n)) return "Data Science";
  if (/web|react|node|javascript|html|css|frontend|full ?stack/.test(n)) return "Web Development";
  if (/java|python|c\+\+|programming|software|development|algorithm|backend/.test(n)) return "Programming";
  return "Other";
}

function parseCertDate(raw) {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

exports.registerWithResume = async (req, res, next) => {
  try {
    const { resumeText, resumeData, additionalFields, password } = req.body;

    if (!resumeText || !resumeData) {
      return res.status(400).json({ error: "Resume data is required" });
    }

    const parsed = typeof resumeData === "string" ? parseResume(resumeText) : resumeData;
    const personal = parsed.personal || {};
    const email = (personal.email || additionalFields?.email || "").toLowerCase();
    const name = personal.name || additionalFields?.name;
    const phone = personal.phone || additionalFields?.phone || "";

    if (!email || !name) {
      return res.status(400).json({
        error: "Email and name are required",
        missing: { email: !email, name: !name }
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const passwordHash = hashPassword(password || crypto.randomBytes(30).toString("hex"));

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const username = await generateUniqueUsername(name);
    const headline = `Computer Science Student at ${parsed.education?.[0]?.institution || ""}`.trim();

    const user = await User.create({
      email,
      passwordHash,
      name,
      username,
      headline,
      role: "STUDENT",
      isVerified: true,
      isApproved: true,
      emailVerified: true,
      phone,
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
      languages: (parsed.languages || []).map((l) => l.name || l),
      achievements: parsed.achievements || [],
      courses: parsed.courses || [],
      careerObjective: parsed.summary || "",
      "privacySettings.profilePublic": true,
    });

    const userId = user._id.toString();
    const atsReport = checkATS(resumeText, null);

    await ATSReport.create({
      userId,
      resumeText,
      score: atsReport.score,
      grade: atsReport.grade,
      breakdown: atsReport.breakdown,
      missingKeywords: atsReport.missingKeywords || [],
      suggestedSkills: atsReport.suggestedSkills || [],
      improvements: atsReport.improvements || [],
      bulletPointSuggestions: atsReport.bulletPointSuggestions || [],
      summarySuggestion: atsReport.summarySuggestion || "",
    });

    const certificateRows = [];
    for (const c of parsed.certifications || []) {
      if (!c.name || !c.issuer) continue;
      certificateRows.push({
        userId,
        name: c.name,
        organization: c.issuer,
        category: inferCertCategory(c.name),
        issueDate: parseCertDate(c.date),
        isPublic: true,
      });
    }
    for (const c of parsed.courses || []) {
      if (!c.name || !c.platform) continue;
      certificateRows.push({
        userId,
        name: c.name,
        organization: c.platform,
        category: inferCertCategory(c.name),
        issueDate: parseCertDate(c.date),
        isPublic: true,
      });
    }
    if (certificateRows.length > 0) {
      await Certificate.insertMany(certificateRows);
    }

    const notifications = [
      {
        userId,
        title: "Welcome to InternGenie!",
        message: `Hi ${name}, your account and profile are ready. Start exploring internships now.`,
        type: "SUCCESS",
      },
      {
        userId,
        title: "ATS Score Ready",
        message: `Your resume scored ${atsReport.score}/100 (grade ${atsReport.grade}). Open the Resume Analyzer to see improvement tips.`,
        type: "ATS",
      },
      {
        userId,
        title: "Profile is Live",
        message: "Your public profile is now discoverable by companies. Keep it updated to get noticed.",
        type: "INFO",
      },
    ];
    await Notification.insertMany(notifications);

    const certCount = await Certificate.countDocuments({ userId });
    const completeness = computeProfileCompleteness(user.toObject(), certCount);
    user.profileCompleted = completeness.score;
    await user.save();

    const token = generateToken(user);
    return res.json({
      user: sanitizeUser(user),
      token,
      atsScore: atsReport.score,
      atsGrade: atsReport.grade,
      certificates: certificateRows.length,
    });
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

    // SECURITY: Never trust a client-supplied role for privileged access.
    // ADMIN accounts may only be created via a protected server-side path
    // (seeding or an admin-owned action), never through public self-registration.
    if (role !== "STUDENT" && role !== "COMPANY") {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const username = await generateUniqueUsername(name);
    const user = await User.create({
      email,
      passwordHash: hashPassword(password),
      name,
      username,
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
      const displayName = name || email.split("@")[0];
      const username = await generateUniqueUsername(displayName);
      user = await User.create({
        email,
        name: displayName,
        username,
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
