import mongoose from "mongoose";

const postViewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
    index: true,
  },
  viewerKey: {
    type: String,
    required: true,
    maxlength: 160,
  },
}, { timestamps: true });

postViewSchema.index({ postId: 1, viewerKey: 1 }, { unique: true });

const PostView = mongoose.model("PostView", postViewSchema);
export default PostView;
