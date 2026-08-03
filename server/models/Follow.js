const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    followerId: { type: String, required: true, ref: "User", index: true },
    followingId: { type: String, required: true, ref: "User", index: true },
  },
  { timestamps: true }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
