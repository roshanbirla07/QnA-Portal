import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["question", "article"],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 220,
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 320,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  contentText: {
    type: String,
    required: true,
    trim: true,
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  coverImage: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  tags: {
    type: [String],
    default: [],
    validate: [(tags) => tags.length <= 10, "Tags cannot exceed 10"],
  },
  status: {
    type: String,
    enum: ["draft", "published", "hidden", "deleted"],
    default: "draft",
    index: true,
  },
  score: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  acceptedAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Answer",
    default: null,
  },
  readingTime: { type: Number, default: 1 },
  publishedAt: Date,
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ type: 1, status: 1, createdAt: -1 });
postSchema.index({ title: "text", contentText: "text", tags: "text" });

const Post = mongoose.model("Post", postSchema);
export default Post;
