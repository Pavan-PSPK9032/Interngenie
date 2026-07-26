const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logoUrl: { type: String },
  industry: { type: String },
  description: { type: String },
  website: { type: String },
  location: { type: String },
  size: { type: String },
  verified: { type: Boolean, default: false },
  approved: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0 },
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
