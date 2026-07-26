const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  conversationId: { type: String, index: true },
  senderId: { type: String, ref: "User" },
  userId: { type: String, ref: "User" },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  readBy: { type: [String], default: [] },
  type: { type: String, enum: ["user", "ai"], default: "user" },
}, { timestamps: true });

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
