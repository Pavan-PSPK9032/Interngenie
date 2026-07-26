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
    role: u.role,
    avatarUrl: u.avatarUrl || undefined,
    phone: u.phone || undefined,
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
    extractedSkills: u.extractedSkills || [],
    profileCompleted: u.profileCompleted || 0,
    companyId: u.companyId || undefined,
    isVerified: u.isVerified || false,
    isApproved: u.isApproved !== undefined ? u.isApproved : true,
    emailVerified: u.emailVerified || true,
  };
}

module.exports = { generateToken, hashPassword, verifyPassword, sanitizeUser };
