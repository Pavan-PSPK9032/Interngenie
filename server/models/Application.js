const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  internshipId: { type: String, required: true, ref: "Internship" },
  studentId: { type: String, required: true, ref: "User" },
  status: { type: String, enum: ["APPLIED", "REVIEW", "INTERVIEW", "SELECTED", "REJECTED"], default: "APPLIED" },
  matchScore: { type: Number, default: 0 },
  matchingSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  coverLetter: { type: String },
  resumeText: { type: String },
  atsScoreAtApply: { type: Number },
  interviewScheduledAt: { type: Date },
  feedback: { type: String },
}, { timestamps: true });

applicationSchema.index({ studentId: 1 });
applicationSchema.index({ internshipId: 1 });
applicationSchema.index({ internshipId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
