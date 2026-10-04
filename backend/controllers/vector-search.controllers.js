import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Post from "../schemas/post.schema.js";
import { configured, semanticSearch } from "../services/vector-search.service.js";

const search = asyncHandler(async (req, res) => {
  if (!configured()) throw new ApiError(503, "Semantic search is not configured yet");
  const text = String(req.body?.text || "").trim();
  if (text.length < 8 || text.length > 2000) throw new ApiError(400, "Search text must be 8–2000 characters");
  const items = await semanticSearch({ text, k: 10 });
  return res.status(200).json(new ApiResponse(200, items, "Related content fetched"));
});

const related = asyncHandler(async (req, res) => {
  if (!configured()) throw new ApiError(503, "Semantic search is not configured yet");
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid post id");
  const post = await Post.findOne({ _id: req.params.id, status: "published" }).select("title excerpt contentText");
  if (!post) throw new ApiError(404, "Post not found");
  const items = await semanticSearch({ text: `${post.title}\n${post.excerpt || post.contentText}`, k: 10, excludeId: post._id });
  return res.status(200).json(new ApiResponse(200, items, "Related content fetched"));
});

export { search, related };
