import mongoose from "mongoose";

const schema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

schema.index({ communityId: 1, jobId: 1 }, { unique: true });
export default mongoose.model("CommunityJob", schema);
