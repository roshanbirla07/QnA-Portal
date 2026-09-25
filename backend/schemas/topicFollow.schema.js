import mongoose from "mongoose";

const topicFollowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
}, { timestamps: true });

topicFollowSchema.index({ userId: 1, topicId: 1 }, { unique: true });

const TopicFollow = mongoose.model("TopicFollow", topicFollowSchema);
export default TopicFollow;
