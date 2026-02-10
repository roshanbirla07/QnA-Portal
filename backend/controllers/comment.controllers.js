import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Comment from "../schemas/comment.schema.js";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const postComment = asyncHandler(async (req, res) => {
  try {
    const { comment, questionId } = req.body;
    if (!comment || !questionId) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }

    const authorId = req.user.id;
    const newComment = await Comment.create({ comment, questionId, authorId });
    return res.status(201).json(new ApiResponse(201, newComment, RESPONSE_MESSAGES.COMMENT_POSTED));
  } catch (error) {
    logger.error("Failed to post comment", { error: error.message, userId: req.user?.id, questionId: req.body?.questionId });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const fetchComments = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!questionId) {
      throw new ApiError(400, RESPONSE_MESSAGES.INVALID_QUESTION_ID);
    }

    const comments = await Comment.find({ questionId });
    return res.status(200).json(new ApiResponse(200, comments, RESPONSE_MESSAGES.COMMENTS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch comments", { error: error.message, questionId: req.params?.questionId });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

export { postComment, fetchComments };
