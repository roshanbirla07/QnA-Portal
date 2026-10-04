import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, required: true, enum: ["expertise", "collaboration", "mentorship", "referral", "project"] },
  note: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ["pending", "accepted", "declined", "canceled"], default: "pending" },
  respondedAt: Date,
}, { timestamps: true });

connectionRequestSchema.index({ senderId: 1, recipientId: 1, purpose: 1 }, { unique: true });
export default mongoose.model("ConnectionRequest", connectionRequestSchema);
