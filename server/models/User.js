const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["STUDENT", "COMPANY", "ADMIN"], default: "STUDENT" },
  avatarUrl: { type: String },
  phone: { type: String },
  college: { type: String },
  degree: { type: String },
  branch: { type: String },
  cgpa: { type: Number },
  graduationYear: { type: Number },
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String },
  resumeUrl: { type: String },
  resumeText: { type: String },
  extractedSkills: { type: [String], default: [] },
  profileCompleted: { type: Number, default: 0 },
  companyId: { type: String },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
