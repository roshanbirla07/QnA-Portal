import mongoose from "mongoose";

const interviewExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 160 },
  companySlug: { type: String, required: true, index: true },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  date: { type: Date, required: true },
  difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"] },
  outcome: { type: String, required: true, enum: ["offer", "rejected", "withdrew", "pending"] },
  rounds: [{
    name: { type: String, required: true, trim: true, maxlength: 100 },
    details: { type: String, trim: true, maxlength: 2000 },
  }],
  summary: { type: String, required: true, trim: true, maxlength: 4000 },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

interviewExperienceSchema.index({ companySlug: 1, createdAt: -1 });
export default mongoose.model("InterviewExperience", interviewExperienceSchema);
