const mongoose = require("mongoose");

const atsReportSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  resumeText: { type: String },
  internshipId: { type: String },
  score: { type: Number, required: true },
  grade: { type: String, required: true },
  breakdown: { type: mongoose.Schema.Types.Mixed, required: true },
  missingKeywords: { type: [String], default: [] },
  suggestedSkills: { type: [String], default: [] },
  improvements: { type: [String], default: [] },
  bulletPointSuggestions: { type: [String], default: [] },
  summarySuggestion: { type: String },
}, { timestamps: true });

atsReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("ATSReport", atsReportSchema);
