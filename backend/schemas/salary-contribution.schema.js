import mongoose from "mongoose";

const salaryContributionSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 160 },
  companySlug: { type: String, required: true, index: true },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  roleSlug: { type: String, required: true, index: true },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  locationKey: { type: String, required: true },
  year: { type: Number, required: true },
  yearsOfExperience: { type: Number, required: true },
  base: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  currency: { type: String, enum: ["INR"], default: "INR" },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

salaryContributionSchema.index({ authorId: 1, companySlug: 1, roleSlug: 1, year: 1 }, { unique: true });
salaryContributionSchema.index({ companySlug: 1, roleSlug: 1, locationKey: 1 });
export default mongoose.model("SalaryContribution", salaryContributionSchema);
