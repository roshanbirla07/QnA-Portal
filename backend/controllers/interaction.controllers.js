import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bookmark from "../schemas/bookmark.schema.js";
import { applyVote, toggleBookmark, toggleFollow } from "../services/interaction.service.js";

const vote = asyncHandler(async (req, res) => {
  const result = await applyVote({
    userId: req.user.id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    value: req.body.value,
  });
  return res.status(200).json(new ApiResponse(200, result, "Vote updated successfully"));
});

const bookmark = asyncHandler(async (req, res) => {
  const result = await toggleBookmark({ userId: req.user.id, postId: req.params.postId, active: true });
  return res.status(200).json(new ApiResponse(200, result, "Post bookmarked"));
});

const unbookmark = asyncHandler(async (req, res) => {
  const result = await toggleBookmark({ userId: req.user.id, postId: req.params.postId, active: false });
  return res.status(200).json(new ApiResponse(200, result, "Bookmark removed"));
});

const listBookmarks = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const rows = await Bookmark.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: "postId",
      match: { status: "published" },
      populate: { path: "author", select: "email username displayName avatar" },
    });
  const posts = rows.map((row) => row.postId).filter(Boolean);
  return res.status(200).json(new ApiResponse(200, posts, "Bookmarks fetched successfully"));
});

const follow = asyncHandler(async (req, res) => {
  const result = await toggleFollow({ followerId: req.user.id, followingId: req.params.userId, active: true });
  return res.status(200).json(new ApiResponse(200, result, "User followed"));
});

const unfollow = asyncHandler(async (req, res) => {
  const result = await toggleFollow({ followerId: req.user.id, followingId: req.params.userId, active: false });
  return res.status(200).json(new ApiResponse(200, result, "User unfollowed"));
});

export { vote, bookmark, unbookmark, listBookmarks, follow, unfollow };
