import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Post from "../schemas/post.schema.js";
import User from "../schemas/user.schema.js";
import Comment from "../schemas/comment.schema.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { createPost, updatePost, archivePost } from "../services/post.service.js";

const toLegacyStatus = (status) => {
  if (status === "published") return "approved";
  if (status === "hidden") return "rejected";
  return "pending";
};

const toLegacyQuestion = (post) => {
  if (!post) return post;
  const value = typeof post.toObject === "function" ? post.toObject() : post;
  return { ...value, questionTitle: value.title, status: toLegacyStatus(value.status) };
};

const ensureQuestionId = (questionId) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new ApiError(400, RESPONSE_MESSAGES.INVALID_QUESTION_ID);
  }
};

const fetchQuestions = asyncHandler(async (req, res) => {
  try {
    const { search } = req.query;
    const query = { type: "question", status: "published" };
    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^$()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      query.$or = [{ title: searchRegex }, { contentText: searchRegex }, { tags: searchRegex }];
    }
    const posts = await Post.find(query)
      .populate("author", "email username displayName avatar")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, posts.map(toLegacyQuestion), RESPONSE_MESSAGES.QUESTIONS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch questions", { error: error.message, search: req.query?.search });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const postQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionTitle, tags } = req.body;
    if (!questionTitle || !tags) throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    const post = await createPost({
      user: req.user,
      payload: {
        type: "question",
        title: questionTitle,
        content: questionTitle,
        contentText: questionTitle,
        tags,
        status: "draft",
      },
    });
    return res.status(201).json(new ApiResponse(201, toLegacyQuestion(post), RESPONSE_MESSAGES.QUESTION_POSTED));
  } catch (error) {
    logger.error("Failed to post question", { error: error.message, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const approveQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId, status } = req.body;
    if (!questionId) throw new ApiError(400, RESPONSE_MESSAGES.QUESTION_ID_REQUIRED);
    ensureQuestionId(questionId);
    if (!["approved", "rejected"].includes(status)) {
      throw new ApiError(400, RESPONSE_MESSAGES.INVALID_QUESTION_STATUS);
    }
    const post = await Post.findOneAndUpdate(
      { _id: questionId, type: "question", status: { $ne: "deleted" } },
      { $set: { status: status === "approved" ? "published" : "hidden", ...(status === "approved" ? { publishedAt: new Date() } : {}) } },
      { new: true }
    );
    if (!post) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);
    return res.status(200).json(new ApiResponse(200, toLegacyQuestion(post), RESPONSE_MESSAGES.QUESTION_UPDATED));
  } catch (error) {
    logger.error("Failed to approve/reject question", { error: error.message, body: req.body });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const approvedQuestions = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user.id, type: "question", status: "published" })
    .populate("author", "email username displayName avatar")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, posts.map(toLegacyQuestion), RESPONSE_MESSAGES.APPROVED_QUESTIONS_FETCHED));
});

const pendingQuestions = asyncHandler(async (req, res) => {
  const query = { type: "question", status: "draft" };
  if (req.user.roleType === "user") query.author = req.user.id;
  const posts = await Post.find(query)
    .populate("author", "email username displayName avatar")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, posts.map(toLegacyQuestion), RESPONSE_MESSAGES.PENDING_QUESTIONS_FETCHED));
});

const editQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    ensureQuestionId(questionId);
    const existing = await Post.findOne({ _id: questionId, type: "question", status: { $ne: "deleted" } });
    if (!existing) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);

    const payload = {};
    if (req.body.questionTitle !== undefined) {
      payload.title = req.body.questionTitle;
      payload.content = req.body.questionTitle;
      payload.contentText = req.body.questionTitle;
    }
    if (req.body.tags !== undefined) payload.tags = req.body.tags;

    const post = await updatePost({ postId: questionId, user: req.user, payload });
    if (req.user.roleType !== "admin") {
      post.status = "draft";
      post.publishedAt = undefined;
      await post.save();
    }
    await post.populate("author", "email username displayName avatar");
    return res.status(200).json(new ApiResponse(200, toLegacyQuestion(post), RESPONSE_MESSAGES.QUESTION_UPDATED));
  } catch (error) {
    logger.error("Failed to edit question", { error: error.message, questionId: req.params?.questionId, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) throw new ApiError(400, RESPONSE_MESSAGES.QUESTION_ID_REQUIRED);
    ensureQuestionId(questionId);
    const question = await Post.findOne({ _id: questionId, type: "question", status: { $ne: "deleted" } });
    if (!question) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);
    await archivePost({ postId: questionId, user: req.user });
    await Comment.deleteMany({ questionId });
    return res.status(200).json(new ApiResponse(200, {}, RESPONSE_MESSAGES.QUESTION_DELETED));
  } catch (error) {
    logger.error("Failed to delete question", { error: error.message, questionId: req.body?.questionId, userId: req.user?.id });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const incrementView = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    ensureQuestionId(questionId);
    const post = await Post.findOneAndUpdate(
      { _id: questionId, type: "question", status: { $ne: "deleted" } },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);
    return res.status(200).json(new ApiResponse(200, toLegacyQuestion(post), RESPONSE_MESSAGES.VIEW_INCREMENTED));
  } catch (error) {
    logger.error("Failed to increment view", { error: error.message, questionId: req.params?.questionId });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.VIEW_INCREMENT_FAILED));
  }
});

const fetchQuestionById = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    ensureQuestionId(questionId);
    const post = await Post.findOne({ _id: questionId, type: "question", status: { $ne: "deleted" } })
      .populate("author", "email username displayName avatar");
    if (!post) throw new ApiError(404, RESPONSE_MESSAGES.QUESTION_NOT_FOUND);
    return res.status(200).json(new ApiResponse(200, toLegacyQuestion(post), RESPONSE_MESSAGES.QUESTION_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch question", { error: error.message, questionId: req.params?.questionId });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

const getAdminStats = asyncHandler(async (req, res) => {
  try {
    const totalQuestions = await Post.countDocuments({ type: "question", status: { $ne: "deleted" } });
    const pendingApprovals = await Post.countDocuments({ type: "question", status: "draft" });
    const activeUsers = await User.countDocuments();
    return res.status(200).json(new ApiResponse(200, { totalQuestions, pendingApprovals, activeUsers }, RESPONSE_MESSAGES.STATS_FETCHED));
  } catch (error) {
    logger.error("Failed to fetch admin stats", { error: error.message });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.STATS_FETCH_FAILED));
  }
});

export {
  fetchQuestions,
  fetchQuestionById,
  postQuestion,
  approveQuestion,
  approvedQuestions,
  pendingQuestions,
  editQuestion,
  deleteQuestion,
  incrementView,
  getAdminStats,
};
