import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  sourceUrl: { type: String, required: true, unique: true, maxlength: 2048 },
  title: { type: String, required: true, trim: true, maxlength: 220 },
  company: { type: String, required: true, trim: true, maxlength: 160 },
  location: { type: String, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["published", "closed"], default: "published" },
}, { timestamps: true });

jobSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Job", jobSchema);
