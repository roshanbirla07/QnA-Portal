import mongoose from "mongoose";

const jobCommentSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

jobCommentSchema.index({ jobId: 1, createdAt: -1 });
export default mongoose.model("JobComment", jobCommentSchema);
