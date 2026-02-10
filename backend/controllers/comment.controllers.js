import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Comment from "../schemas/comment.schema.js";
import mongoose from "mongoose";

const postComment = asyncHandler(async (req, res) => {
    try {
        const { comment, questionId } = req.body;
        if(!comment || !questionId) {
            throw new ApiError(400, "All fields are required");
        }
        const authorId = req.user.id;
        const newComment = await Comment.create({ comment, questionId, authorId });
        return res.status(201).json(
            new ApiResponse(201, newComment, "Comment posted successfully")
        );
    } catch (error) {
        console.error(error.message);
        const statusCode = error instanceof ApiError ? error.statusCode : 500;
        return res.status(statusCode).json(new ApiResponse(statusCode, {}, error.message || "Internal Server Error"));
    }
});

const fetchComments = asyncHandler(async (req, res) => {
    try {
        const { questionId } = req.params;
        console.log("cg", questionId);
        if(!(questionId))
            throw new ApiError(400, "Invalid Question Id");
        const comments = await Comment.find({ questionId });
        return res.status(200).json(new ApiResponse(200, comments, "Comments Fetched Successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
});

export {
    postComment,
    fetchComments
}