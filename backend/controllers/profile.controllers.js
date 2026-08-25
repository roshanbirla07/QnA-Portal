import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../schemas/user.schema.js";
import Post from "../schemas/post.schema.js";

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select("-password -email");
  if (!user) throw new ApiError(404, "User not found");
  const recentPosts = await Post.find({ author: user._id, status: "published" })
    .sort({ publishedAt: -1 })
    .limit(10)
    .select("type title slug excerpt tags score views answerCount publishedAt");
  return res.status(200).json(new ApiResponse(200, { user, recentPosts }, "Profile fetched successfully"));
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ["username", "displayName", "avatar", "bio", "headline", "location", "website", "github", "linkedin"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
  }
  if (updates.username) updates.username = updates.username.toLowerCase();
  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select("-password");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

export { getProfile, updateMyProfile };
