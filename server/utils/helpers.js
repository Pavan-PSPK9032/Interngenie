const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function generateToken(user) {
  return jwt.sign({ uid: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

function sanitizeUser(u) {
  return {
    id: u._id ? u._id.toString() : u.id,
    email: u.email,
    name: u.name,
    username: u.username || undefined,
    role: u.role,
    avatarUrl: u.avatarUrl || undefined,
    bannerUrl: u.bannerUrl || undefined,
    bannerPosition: u.bannerPosition || "50% 50%",
    headline: u.headline || "",
    location: u.location || "",
    phone: u.phone || undefined,
    address: u.address || undefined,
    college: u.college || undefined,
    degree: u.degree || undefined,
    branch: u.branch || undefined,
    cgpa: u.cgpa || undefined,
    graduationYear: u.graduationYear || undefined,
    skills: u.skills || [],
    interests: u.interests || [],
    preferredLocations: u.preferredLocations || [],
    languages: u.languages || [],
    linkedin: u.linkedin || undefined,
    github: u.github || undefined,
    portfolio: u.portfolio || undefined,
    resumeUrl: u.resumeUrl || undefined,
    resumeText: u.resumeText || undefined,
    resumeData: u.resumeData || undefined,
    extractedSkills: u.extractedSkills || [],
    profileCompleted: u.profileCompleted || 0,
    careerObjective: u.careerObjective || "",
    dob: u.dob || undefined,
    gender: u.gender || undefined,
    achievements: u.achievements || [],
    projects: u.projects || [],
    experience: u.experience || [],
    certifications: u.certifications || [],
    courses: u.courses || [],
    privacySettings: u.privacySettings || {
      visibility: "public",
      profilePublic: true,
      showEmail: false,
      showPhone: false,
      showLinkedIn: true,
      showGitHub: true,
      showPortfolio: true,
      showCertificates: true,
      showProjects: true,
      showExperience: true,
      showAtsScore: true,
      showResume: true,
    },
    profileViews: u.profileViews || 0,
    searchAppearances: u.searchAppearances || 0,
    companyId: u.companyId || undefined,
    isVerified: u.isVerified || false,
    isApproved: u.isApproved !== undefined ? u.isApproved : true,
    emailVerified: u.emailVerified || true,
  };
}

const crypto = require("crypto");

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { generateToken, hashPassword, verifyPassword, sanitizeUser, generateResetToken, generateVerificationToken };
