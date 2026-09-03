const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  companyId: { type: String, required: true, ref: "Company" },
  description: { type: String, required: true },
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  domain: { type: String, required: true },
  location: { type: String, required: true },
  workMode: { type: String, enum: ["remote", "hybrid", "onsite"], default: "onsite" },
  duration: { type: Number, required: true },
  stipend: { type: Number, default: 0 },
  openings: { type: Number, default: 1 },
  deadline: { type: Date },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"], default: "PENDING" },
  rejectionReason: { type: String },
}, { timestamps: true });

internshipSchema.index({ companyId: 1 });
internshipSchema.index({ domain: 1 });
internshipSchema.index({ isActive: 1 });
internshipSchema.index({ status: 1 });

module.exports = mongoose.model("Internship", internshipSchema);
