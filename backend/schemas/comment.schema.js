import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  comment: { type: String, required: true, trim: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

commentSchema.index({ questionId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
