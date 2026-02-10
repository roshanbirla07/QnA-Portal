import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import QnA from "../schemas/qna.schema.js";
import User from "../schemas/user.schema.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const fetchQuestions = asyncHandler(async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: "approved" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [{ questionTitle: searchRegex }, { tags: searchRegex }];
    }

    const questions = await QnA.find(query)
      .populate("author", "email")
      .populate("answerCount")
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, questions, RESPONSE_MESSAGES.QUESTIONS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch questions", { error: error.message, search: req.query?.search });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const postQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionTitle, tags } = req.body;
    if (!questionTitle || !tags) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }

    const question = await QnA.create({
      questionTitle,
      author: req.user.id,
      tags,
    });

    return res.status(201).json(new ApiResponse(201, question, RESPONSE_MESSAGES.QUESTION_POSTED));
  } catch (error) {
    logger.error("Failed to post question", { error: error.message, userId: req.user?.id });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, {}, error.message));
    }
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const approveQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId, status } = req.body;
    if (!questionId) throw new ApiError(400, RESPONSE_MESSAGES.QUESTION_ID_REQUIRED);

    const updatedQuestion = await QnA.findByIdAndUpdate(
      new mongoose.Types.ObjectId(questionId),
      { $set: { status } },
      { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedQuestion, RESPONSE_MESSAGES.QUESTION_UPDATED));
  } catch (error) {
    logger.error("Failed to approve/reject question", { error: error.message, body: req.body });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, {}, error.message));
    }
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const approvedQuestions = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await QnA.find({ $and: [{ author: userId }, { status: "approved" }] })
      .populate("author", "email")
      .populate("answerCount")
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, questions, RESPONSE_MESSAGES.APPROVED_QUESTIONS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch approved questions", { error: error.message, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const pendingQuestions = asyncHandler(async (req, res) => {
  try {
    const query = { status: "pending" };
    if (req.user.roleType === "user") {
      query.author = req.user.id;
    }

    const questions = await QnA.find(query).populate("author", "email").sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, questions, RESPONSE_MESSAGES.PENDING_QUESTIONS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch pending questions", { error: error.message, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const editQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionTitle, tags } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, RESPONSE_MESSAGES.INVALID_QUESTION_ID);
    }

    const question = await QnA.findById(questionId);

    if (!question) {
      throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);
    }

    if (question.author.toString() !== userId) {
      throw new ApiError(403, RESPONSE_MESSAGES.EDIT_NOT_ALLOWED);
    }

    if (questionTitle) {
      question.questionTitle = questionTitle;
    }

    if (tags) {
      if (!Array.isArray(tags)) {
        throw new ApiError(400, RESPONSE_MESSAGES.TAGS_MUST_BE_ARRAY);
      }
      if (tags.length > 10) {
        throw new ApiError(400, RESPONSE_MESSAGES.TAGS_LIMIT_EXCEEDED);
      }
      question.tags = tags;
    }

    if (req.user.roleType !== "admin") {
      question.status = "pending";
    }

    const updatedQuestion = await question.save();

    return res.status(200).json(new ApiResponse(200, updatedQuestion, RESPONSE_MESSAGES.QUESTION_UPDATED));
  } catch (error) {
    logger.error("Failed to edit question", { error: error.message, questionId: req.params?.questionId, userId: req.user?.id });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(new ApiResponse(error.statusCode, {}, error.message));
    }
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) throw new ApiError(400, RESPONSE_MESSAGES.QUESTION_ID_REQUIRED);

    const deletedQuestion = await QnA.findByIdAndDelete(questionId);
    if (!deletedQuestion) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);

    return res.status(200).json(new ApiResponse(200, {}, RESPONSE_MESSAGES.QUESTION_DELETED));
  } catch (error) {
    logger.error("Failed to delete question", { error: error.message, questionId: req.body?.questionId, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const incrementView = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await QnA.findByIdAndUpdate(questionId, { $inc: { views: 1 } }, { new: true });
    return res.status(200).json(new ApiResponse(200, question, RESPONSE_MESSAGES.VIEW_INCREMENTED));
  } catch (error) {
    logger.error("Failed to increment view", { error: error.message, questionId: req.params?.questionId });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.VIEW_INCREMENT_FAILED));
  }
});

const getAdminStats = asyncHandler(async (req, res) => {
  try {
    const totalQuestions = await QnA.countDocuments();
    const pendingApprovals = await QnA.countDocuments({ status: "pending" });
    const activeUsers = await User.countDocuments();

    return res
      .status(200)
      .json(new ApiResponse(200, { totalQuestions, pendingApprovals, activeUsers }, RESPONSE_MESSAGES.STATS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch admin stats", { error: error.message });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.STATS_FETCH_FAILED));
  }
});

export {
  fetchQuestions,
  postQuestion,
  approveQuestion,
  approvedQuestions,
  pendingQuestions,
  editQuestion,
  deleteQuestion,
  incrementView,
  getAdminStats,
};
