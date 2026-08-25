import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { createAnswer, acceptAnswer, listAnswers } from "../services/answer.service.js";

const create = asyncHandler(async (req, res) => {
  const answer = await createAnswer({
    userId: req.user.id,
    questionId: req.params.questionId,
    content: req.body.content,
    contentText: req.body.contentText,
  });
  return res.status(201).json(new ApiResponse(201, answer, "Answer created successfully"));
});

const list = asyncHandler(async (req, res) => {
  const answers = await listAnswers({ questionId: req.params.questionId, limit: req.query.limit });
  return res.status(200).json(new ApiResponse(200, answers, "Answers fetched successfully"));
});

const accept = asyncHandler(async (req, res) => {
  const answer = await acceptAnswer({
    user: req.user,
    questionId: req.params.questionId,
    answerId: req.params.answerId,
  });
  return res.status(200).json(new ApiResponse(200, answer, "Answer accepted successfully"));
});

export { create, list, accept };
