import mongoose from "mongoose";

const topicReputationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
  reputation: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
}, { timestamps: true });

topicReputationSchema.index({ userId: 1, topicId: 1 }, { unique: true });
topicReputationSchema.index({ topicId: 1, reputation: -1 });

const TopicReputation = mongoose.model("TopicReputation", topicReputationSchema);
export default TopicReputation;
