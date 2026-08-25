import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { listFeed, listFollowingFeed, searchPosts } from "../services/feed.service.js";

const feed = asyncHandler(async (req, res) => {
  const data = await listFeed({ query: req.query });
  return res.status(200).json(new ApiResponse(200, data, "Feed fetched successfully"));
});

const followingFeed = asyncHandler(async (req, res) => {
  const data = await listFollowingFeed({ userId: req.user.id, query: req.query });
  return res.status(200).json(new ApiResponse(200, data, "Following feed fetched successfully"));
});

const search = asyncHandler(async (req, res) => {
  const data = await searchPosts({ query: req.query });
  return res.status(200).json(new ApiResponse(200, data, "Search results fetched successfully"));
});

export { feed, followingFeed, search };
