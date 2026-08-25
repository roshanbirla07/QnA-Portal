import mongoose from "mongoose";
import Answer from "../schemas/answer.schema.js";
import Post from "../schemas/post.schema.js";
import ApiError from "../utils/ApiError.js";

const createAnswer = async ({ userId, questionId, content, contentText }) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) throw new ApiError(400, "Invalid question id");
  if (!content || !contentText?.trim()) throw new ApiError(400, "Answer content is required");

  const question = await Post.findOne({ _id: questionId, type: "question", status: "published" });
  if (!question) throw new ApiError(404, "Question not found");

  const answer = await Answer.create({
    questionId,
    authorId: userId,
    content,
    contentText: contentText.trim(),
  });

  question.answerCount += 1;
  await question.save();
  return answer;
};

const acceptAnswer = async ({ user, questionId, answerId }) => {
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    throw new ApiError(400, "Invalid question or answer id");
  }

  const question = await Post.findOne({ _id: questionId, type: "question", status: { $ne: "deleted" } });
  if (!question) throw new ApiError(404, "Question not found");
  if (question.author.toString() !== user.id && user.roleType !== "admin") {
    throw new ApiError(403, "Only the question owner can accept an answer");
  }

  const answer = await Answer.findOne({ _id: answerId, questionId, status: "published" });
  if (!answer) throw new ApiError(404, "Answer not found");

  if (question.acceptedAnswerId) {
    await Answer.updateOne({ _id: question.acceptedAnswerId }, { $set: { accepted: false } });
  }
  answer.accepted = true;
  question.acceptedAnswerId = answer._id;
  await Promise.all([answer.save(), question.save()]);
  return answer;
};

const listAnswers = async ({ questionId, limit = 30 }) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) throw new ApiError(400, "Invalid question id");
  return Answer.find({ questionId, status: "published" })
    .populate("authorId", "email username displayName avatar")
    .sort({ accepted: -1, score: -1, createdAt: 1 })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 100));
};

export { createAnswer, acceptAnswer, listAnswers };
