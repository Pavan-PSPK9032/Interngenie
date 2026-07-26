const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

chatMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
