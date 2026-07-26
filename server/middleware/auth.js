const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.uid);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      skills: user.skills,
      interests: user.interests,
      preferredLocations: user.preferredLocations,
      cgpa: user.cgpa,
      extractedSkills: user.extractedSkills,
      profileCompleted: user.profileCompleted,
      companyId: user.companyId,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      emailVerified: user.emailVerified,
    };
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.uid);
    req.user = user
      ? {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          skills: user.skills,
          interests: user.interests,
          preferredLocations: user.preferredLocations,
          cgpa: user.cgpa,
          extractedSkills: user.extractedSkills,
          profileCompleted: user.profileCompleted,
          companyId: user.companyId,
          isVerified: user.isVerified,
          isApproved: user.isApproved,
          emailVerified: user.emailVerified,
        }
      : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

module.exports = { auth, optionalAuth, requireRole };
