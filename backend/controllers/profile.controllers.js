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
  const allowed = ["username", "displayName", "avatar", "bio", "headline", "location", "website", "github", "linkedin", "candidateProfileVisible", "openToOpportunities"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (["candidateProfileVisible", "openToOpportunities"].includes(key)) {
      if (typeof req.body[key] !== "boolean") throw new ApiError(400, `${key} must be a boolean`);
      updates[key] = req.body[key];
    } else {
      if (typeof req.body[key] !== "string") throw new ApiError(400, `${key} must be text`);
      updates[key] = req.body[key].trim();
    }
  }
  if (updates.username !== undefined) {
    updates.username = updates.username.toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(updates.username)) {
      throw new ApiError(400, "Username must be 3–40 characters: letters, numbers, underscores, or hyphens; start with a letter or number");
    }
  }
  if (updates.candidateProfileVisible === true && updates.username === undefined) {
    const current = await User.findById(req.user.id).select("username").lean();
    if (!current?.username) throw new ApiError(400, "Set a QnA username before publishing your profile");
  }
  let user;
  try {
    user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select("-password -email");
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "That QnA username is already taken");
    if (error.name === "ValidationError") throw new ApiError(400, "Check the length and format of your profile fields");
    throw error;
  }
  if (!user) throw new ApiError(404, "User not found");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

export { getProfile, updateMyProfile };
