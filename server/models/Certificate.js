const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "User" },
  internshipId: { type: String, required: true },
  internshipTitle: { type: String, required: true },
  companyName: { type: String, required: true },
  studentName: { type: String, required: true },
  certificateId: { type: String, required: true, unique: true },
  skills: { type: [String], default: [] },
}, { timestamps: true });

certificateSchema.index({ userId: 1 });
certificateSchema.index({ certificateId: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);
