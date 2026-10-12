import mongoose from "mongoose";

const skillSignalSchema = new mongoose.Schema({
  skill: { type: String, required: true, lowercase: true, trim: true, maxlength: 80 },
  label: { type: String, trim: true, maxlength: 120, default: "" },
  value: { type: Number, default: 1 },
  evidenceUrl: { type: String, default: "" },
}, { _id: false });

const externalProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  platform: {
    type: String,
    required: true,
    enum: ["github", "leetcode", "codeforces", "medium"],
    index: true,
  },
  handle: { type: String, required: true, trim: true, maxlength: 120 },
  profileUrl: { type: String, required: true, maxlength: 2048 },
  visibility: { type: String, enum: ["public", "hidden"], default: "public", index: true },
  verificationStatus: {
    type: String,
    enum: ["linked", "verified", "failed"],
    default: "linked",
    index: true,
  },
  verificationNote: { type: String, maxlength: 240, default: "" },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  skills: { type: [String], default: [] },
  skillSignals: { type: [skillSignalSchema], default: [] },
  lastSyncedAt: { type: Date, default: null },
}, { timestamps: true });

externalProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });
externalProfileSchema.index({ platform: 1, handle: 1 });
externalProfileSchema.index({ skills: 1, verificationStatus: 1, visibility: 1 });

const ExternalProfile = mongoose.model("ExternalProfile", externalProfileSchema);
export default ExternalProfile;
