import mongoose from "mongoose";

const jobSignalSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kind: { type: String, required: true, enum: ["saved", "applied", "still_open", "got_interview", "closed", "incorrect"] },
}, { timestamps: true });

jobSignalSchema.index({ jobId: 1, userId: 1, kind: 1 }, { unique: true });
jobSignalSchema.index({ jobId: 1, kind: 1 });
export default mongoose.model("JobSignal", jobSignalSchema);
