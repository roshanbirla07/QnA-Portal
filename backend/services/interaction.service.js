import mongoose from "mongoose";
import Answer from "../schemas/answer.schema.js";
import Post from "../schemas/post.schema.js";
import Vote from "../schemas/vote.schema.js";
import Bookmark from "../schemas/bookmark.schema.js";
import Follow from "../schemas/follow.schema.js";
import ApiError from "../utils/ApiError.js";

const resolveVoteTarget = async (targetType, targetId) => {
  if (!mongoose.Types.ObjectId.isValid(targetId)) throw new ApiError(400, "Invalid target id");
  if (targetType === "post") return Post.findOne({ _id: targetId, status: { $ne: "deleted" } });
  if (targetType === "answer") return Answer.findOne({ _id: targetId, status: { $ne: "deleted" } });
  throw new ApiError(400, "Invalid vote target type");
};

const applyVote = async ({ userId, targetType, targetId, value }) => {
  if (![-1, 0, 1].includes(Number(value))) throw new ApiError(400, "Vote value must be -1, 0 or 1");
  const target = await resolveVoteTarget(targetType, targetId);
  if (!target) throw new ApiError(404, "Vote target not found");

  const existing = await Vote.findOne({ userId, targetType, targetId });
  const nextValue = Number(value);
  const previousValue = existing?.value || 0;

  if (nextValue === 0) {
    if (existing) await existing.deleteOne();
  } else if (existing) {
    existing.value = nextValue;
    await existing.save();
  } else {
    await Vote.create({ userId, targetType, targetId, value: nextValue });
  }

  const delta = nextValue - previousValue;
  if (delta !== 0) {
    target.score += delta;
    await target.save();
  }

  return { score: target.score, userVote: nextValue };
};

const toggleBookmark = async ({ userId, postId, active }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post id");
  const post = await Post.findOne({ _id: postId, status: "published" });
  if (!post) throw new ApiError(404, "Post not found");

  const existing = await Bookmark.findOne({ userId, postId });
  if (active && !existing) {
    await Bookmark.create({ userId, postId });
    post.bookmarkCount += 1;
    await post.save();
  }
  if (!active && existing) {
    await existing.deleteOne();
    post.bookmarkCount = Math.max(0, post.bookmarkCount - 1);
    await post.save();
  }
  return { bookmarked: Boolean(active), bookmarkCount: post.bookmarkCount };
};

const toggleFollow = async ({ followerId, followingId, active }) => {
  if (!mongoose.Types.ObjectId.isValid(followingId)) throw new ApiError(400, "Invalid user id");
  if (followerId === followingId) throw new ApiError(400, "You cannot follow yourself");

  const existing = await Follow.findOne({ followerId, followingId });
  if (active && !existing) await Follow.create({ followerId, followingId });
  if (!active && existing) await existing.deleteOne();
  return { following: Boolean(active) };
};

export { applyVote, toggleBookmark, toggleFollow };
