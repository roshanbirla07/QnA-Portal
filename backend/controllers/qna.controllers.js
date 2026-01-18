import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import QnA from "../schemas/qna.schema.js";
import mongoose from "mongoose";

const fetchQuestions = asyncHandler(async (req, res) => {
  try {
    const questions = await QnA.find({ status: "approved" });
    return res.status(200).json(new ApiResponse(200, questions, "Questions fetched Successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));

  }
});

const postQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionTitle, tags } = req.body;
    console.log(tags, typeof (tags));
    if (!questionTitle || !tags) {
      throw new ApiError(401, "All Fields are Required");
    }
    const question = await QnA.create({
      questionTitle,
      author: req.user.id,
      tags,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, question, "Question Posted Successfully"));
  } catch (error) {
    console.error(error.message);
    return res.status(500).json(error);
  }
});

const approveQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId, status } = req.body;
    if (!questionId) throw new ApiError(401, "Question Id is Required");
    const updatedQuestion = await QnA.findByIdAndUpdate(
      new mongoose.Types.ObjectId(questionId),
      {
        $set: {
          status,
        },
      },
      {
        new: true,
      }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedQuestion, "Question updated Successfully")
      );
  } catch (error) {
    console.error(error.message);

    return res.status(500).json(error);
  }
});

const approvedQuestions = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await QnA.find({
      $and: [{ author: userId }, { status: "approved" }],
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          questions,
          "Approved Questions fetched Successfully"
        )
      );
  } catch (error) {
    console.error(error.message);
    return res.status(error.statusCode).json(error);
  }
});

const pendingQuestions = asyncHandler(async (req, res) => {
  try {
    let questions;
    if (req.user.roleType === "user") {
      const userId = req.user.id;
      questions = await QnA.find({
        $and: [{ author: userId }, { status: "pending" }],
      });
    }
    if (req.user.roleType === "admin") {
      questions = await QnA.find({ status: "pending" });
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          questions,
          "Approved Questions fetched Successfully"
        )
      );
  } catch (error) {
    console.error(error.message, "jjjkk");
    return res.status(error.statusCode).json(error);
  }
});

const editQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionTitle, tags } = req.body;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID");
    }

    const question = await QnA.findById(questionId);

    if (!question) {
      throw new ApiError(404, "Question not found");
    }
    if (question.author.toString() !== userId) {
      throw new ApiError(403, "You are not authorized to edit this question");
    }

    if (questionTitle) {
      question.questionTitle = questionTitle;
    }

    if (tags) {
      if (!Array.isArray(tags)) {
        throw new ApiError(400, "Tags must be an array");
      }
      if (tags.length > 10) {
        throw new ApiError(400, "Tags cannot exceed the limit of 10");
      }
      question.tags = tags;
    }

    const updatedQuestion = await question.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedQuestion, "Question updated successfully")
      );
  } catch (error) {
    console.error(error.message);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error);
    }
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});


const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) throw new ApiError(400, "Question Id is required");
    const deletedQuestion = await QnA.findByIdAndDelete(questionId);
    if (!deletedQuestion) throw new ApiError(501, "Question id is invalid");
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Question deleted Successfully"));
  } catch (error) {
    console.error(error.message);
    return res.status(error.statusCode).json(error);
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
};
