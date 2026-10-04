import mongoose from "mongoose";

const schema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 160 },
  companySlug: { type: String, required: true, index: true },
  note: { type: String, trim: true, maxlength: 500, default: "" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ employeeId: 1, companySlug: 1 }, { unique: true });
schema.index({ active: 1, companySlug: 1, createdAt: -1 });
export default mongoose.model("ReferralOffer", schema);
