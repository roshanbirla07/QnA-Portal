import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetType: {
    type: String,
    enum: ["post", "answer"],
    required: true,
  },
  value: {
    type: Number,
    enum: [-1, 1],
    required: true,
  },
}, { timestamps: true });

voteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
voteSchema.index({ targetId: 1, targetType: 1 });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
