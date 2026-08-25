import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
    index: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  contentText: {
    type: String,
    required: true,
    trim: true,
  },
  score: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  accepted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["published", "hidden", "deleted"],
    default: "published",
  },
}, { timestamps: true });

answerSchema.index({ questionId: 1, accepted: -1, score: -1, createdAt: 1 });

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
