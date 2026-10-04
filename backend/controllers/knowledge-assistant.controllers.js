import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { configured } from "../services/vector-search.service.js";
import { answerQuestion } from "../services/knowledge-assistant.service.js";

const ask = asyncHandler(async (req, res) => {
  if (!configured()) throw new ApiError(503, "Knowledge assistant is not configured");
  const question = String(req.body?.question || "").trim();
  if (question.length < 8 || question.length > 1000) throw new ApiError(400, "Question must be 8–1000 characters");
  const result = await answerQuestion(question);
  return res.status(200).json(new ApiResponse(200, result, "Answer fetched"));
});

export { ask };
