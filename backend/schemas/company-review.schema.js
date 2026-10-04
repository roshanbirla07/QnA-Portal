import mongoose from "mongoose";

const companyReviewSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 160 },
  companySlug: { type: String, required: true, index: true },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  employment: { type: String, required: true, enum: ["current", "former"] },
  rating: { type: Number, required: true, min: 1, max: 5 },
  headline: { type: String, required: true, trim: true, maxlength: 180 },
  pros: { type: String, required: true, trim: true, maxlength: 2000 },
  cons: { type: String, required: true, trim: true, maxlength: 2000 },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  verificationStatus: { type: String, enum: ["unverified", "verified"], default: "unverified" },
  verifiedAt: Date,
}, { timestamps: true });

companyReviewSchema.index({ authorId: 1, companySlug: 1 }, { unique: true });
companyReviewSchema.index({ companySlug: 1, createdAt: -1 });
export default mongoose.model("CompanyReview", companyReviewSchema);
