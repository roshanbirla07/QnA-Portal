import mongoose from "mongoose";

const schema = new mongoose.Schema({
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: "ReferralOffer", required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobUrl: { type: String, required: true, maxlength: 2048 },
  note: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["pending", "accepted", "declined", "canceled"], default: "pending" },
  respondedAt: Date,
}, { timestamps: true });

schema.index({ offerId: 1, candidateId: 1 }, { unique: true });
export default mongoose.model("ReferralRequest", schema);
