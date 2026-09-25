import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getTopicPage, followTopic, unfollowTopic, listTopics } from "../services/topic.service.js";

const list = asyncHandler(async (req, res) => {
  const topics = await listTopics({ q: req.query.q, limit: req.query.limit });
  return res.status(200).json(new ApiResponse(200, topics, "Topics fetched successfully"));
});

const getBySlug = asyncHandler(async (req, res) => {
  const data = await getTopicPage({
    slug: req.params.slug,
    sort: req.query.sort,
    type: req.query.type,
    limit: req.query.limit,
    userId: req.user?.id,
  });
  return res.status(200).json(new ApiResponse(200, data, "Topic fetched successfully"));
});

const follow = asyncHandler(async (req, res) => {
  const topic = await followTopic({ userId: req.user.id, slug: req.params.slug });
  return res.status(200).json(new ApiResponse(200, topic, "Topic followed successfully"));
});

const unfollow = asyncHandler(async (req, res) => {
  const topic = await unfollowTopic({ userId: req.user.id, slug: req.params.slug });
  return res.status(200).json(new ApiResponse(200, topic, "Topic unfollowed successfully"));
});

export { list, getBySlug, follow, unfollow };
