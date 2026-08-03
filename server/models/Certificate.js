const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "User" },
  name: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ["Programming", "AI", "Cloud", "Cybersecurity", "Data Science", "Web Development", "Other"],
    default: "Other"
  },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  credentialId: { type: String, trim: true },
  verificationLink: { type: String, trim: true },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String, enum: ["pdf", "png", "jpeg", "jpg"], default: "pdf" },
  isPublic: { type: Boolean, default: true },
  description: { type: String },
  skills: { type: [String], default: [] },
}, { timestamps: true });

certificateSchema.index({ userId: 1 });
certificateSchema.index({ userId: 1, isPublic: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);