import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { discoverExperts } from "../services/expert.service.js";

const list = asyncHandler(async (req, res) => {
  const result = await discoverExperts({ topicSlug: req.query.topic, limit: req.query.limit });
  return res.status(200).json(new ApiResponse(200, result, "Experts fetched successfully"));
});

export { list };
