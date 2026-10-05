import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { matchJobs } from "../services/job-matching.service.js";
const matches = asyncHandler(async (req, res) => {
  const result = await matchJobs(req.user.id);
  return res.status(200).json(new ApiResponse(200, result, "Job matches fetched"));
});
export { matches };
