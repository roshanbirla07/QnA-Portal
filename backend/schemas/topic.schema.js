import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  followersCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
}, { timestamps: true });

topicSchema.index({ postCount: -1, followersCount: -1 });

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;
