import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  repositoryUrl: { type: String, trim: true, maxlength: 2048 },
  tags: { type: [String], default: [] },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["open", "closed"], default: "open" },
}, { timestamps: true });

projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ tags: 1, createdAt: -1 });
export default mongoose.model("Project", projectSchema);
