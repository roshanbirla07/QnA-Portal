import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  topics: [{ type: String, required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  membersCount: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.model("Community", communitySchema);
