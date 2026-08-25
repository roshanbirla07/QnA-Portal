import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Post from "../schemas/post.schema.js";
import {
  createPost,
  getPostBySlug,
  updatePost,
  publishPost,
  archivePost,
} from "../services/post.service.js";

const create = asyncHandler(async (req, res) => {
  const post = await createPost({ user: req.user, payload: req.body });
  return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

const getBySlug = asyncHandler(async (req, res) => {
  const post = await getPostBySlug({ slug: req.params.slug, requesterId: req.user?.id });
  return res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

const update = asyncHandler(async (req, res) => {
  const post = await updatePost({ postId: req.params.postId, user: req.user, payload: req.body });
  return res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
});

const publish = asyncHandler(async (req, res) => {
  const post = await publishPost({ postId: req.params.postId, user: req.user });
  return res.status(200).json(new ApiResponse(200, post, "Post published successfully"));
});

const remove = asyncHandler(async (req, res) => {
  await archivePost({ postId: req.params.postId, user: req.user });
  return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

const listMine = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const filter = { author: req.user.id, status: { $ne: "deleted" } };
  if (req.query.type) {
    if (!["question", "article"].includes(req.query.type)) throw new ApiError(400, "Invalid post type");
    filter.type = req.query.type;
  }
  if (req.query.status) filter.status = req.query.status;

  const posts = await Post.find(filter).sort({ updatedAt: -1 }).limit(limit);
  return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
});

const incrementView = asyncHandler(async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  ).select("slug views");
  if (!post) throw new ApiError(404, "Post not found");
  return res.status(200).json(new ApiResponse(200, post, "View recorded"));
});

export { create, getBySlug, update, publish, remove, listMine, incrementView };
