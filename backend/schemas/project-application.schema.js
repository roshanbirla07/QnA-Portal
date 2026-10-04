import mongoose from "mongoose";

const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  note: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["pending", "accepted", "declined", "withdrawn"], default: "pending" },
  respondedAt: Date,
}, { timestamps: true });

schema.index({ projectId: 1, applicantId: 1 }, { unique: true });
export default mongoose.model("ProjectApplication", schema);
