import mongoose from "mongoose";

const schema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

schema.index({ communityId: 1, userId: 1 }, { unique: true });
export default mongoose.model("CommunityMember", schema);
