import mongoose from "mongoose";
import Post from "../schemas/post.schema.js";
import ApiError from "../utils/ApiError.js";

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) throw new ApiError(400, "Tags must be an array");
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
};

const slugify = (value) => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const makeUniqueSlug = async (title, excludedId = null) => {
  const base = slugify(title) || "post";
  let slug = base;
  let suffix = 2;

  while (await Post.exists({ slug, ...(excludedId ? { _id: { $ne: excludedId } } : {}) })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
};

const calculateReadingTime = (contentText) => {
  const words = String(contentText || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

const ensurePostOwner = (post, user) => {
  const isOwner = post.author.toString() === user.id;
  const isAdmin = user.roleType === "admin";
  if (!isOwner && !isAdmin) throw new ApiError(403, "You are not allowed to modify this post");
};

const createPost = async ({ user, payload }) => {
  const { type, title, subtitle, content, contentText, excerpt, coverImage, tags = [], status = "draft" } = payload;
  if (!["question", "article"].includes(type)) throw new ApiError(400, "Post type must be question or article");
  if (!title?.trim() || !content || !contentText?.trim()) throw new ApiError(400, "Title and content are required");
  if (!["draft", "published"].includes(status)) throw new ApiError(400, "Invalid initial status");
  if (type === "question" && coverImage) throw new ApiError(400, "Question posts do not support cover images");

  const slug = await makeUniqueSlug(title);
  const post = await Post.create({
    type,
    title: title.trim(),
    subtitle: subtitle?.trim(),
    slug,
    content,
    contentText: contentText.trim(),
    excerpt: excerpt?.trim() || contentText.trim().slice(0, 240),
    coverImage: type === "article" ? coverImage : undefined,
    author: user.id,
    tags: normalizeTags(tags),
    status,
    readingTime: calculateReadingTime(contentText),
    publishedAt: status === "published" ? new Date() : undefined,
  });
  return post;
};

const getPostBySlug = async ({ slug, requesterId }) => {
  const post = await Post.findOne({ slug }).populate("author", "email username displayName avatar bio");
  if (!post || post.status === "deleted") throw new ApiError(404, "Post not found");

  const isOwner = requesterId && post.author?._id?.toString() === requesterId;
  if (!["published"].includes(post.status) && !isOwner) throw new ApiError(404, "Post not found");
  return post;
};

const updatePost = async ({ postId, user, payload }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post id");
  const post = await Post.findById(postId);
  if (!post || post.status === "deleted") throw new ApiError(404, "Post not found");
  ensurePostOwner(post, user);

  const editable = ["title", "subtitle", "content", "contentText", "excerpt", "coverImage"];
  editable.forEach((key) => {
    if (payload[key] !== undefined) post[key] = typeof payload[key] === "string" ? payload[key].trim() : payload[key];
  });
  if (payload.tags !== undefined) post.tags = normalizeTags(payload.tags);
  if (payload.title) post.slug = await makeUniqueSlug(payload.title, post._id);
  if (payload.contentText !== undefined) post.readingTime = calculateReadingTime(payload.contentText);
  if (post.type === "question") post.coverImage = undefined;
  await post.save();
  return post;
};

const publishPost = async ({ postId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post id");
  const post = await Post.findById(postId);
  if (!post || post.status === "deleted") throw new ApiError(404, "Post not found");
  ensurePostOwner(post, user);
  if (!post.title?.trim() || !post.contentText?.trim()) throw new ApiError(400, "Post is incomplete");
  post.status = "published";
  post.publishedAt = post.publishedAt || new Date();
  await post.save();
  return post;
};

const archivePost = async ({ postId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) throw new ApiError(400, "Invalid post id");
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");
  ensurePostOwner(post, user);
  post.status = "deleted";
  await post.save();
};

export {
  createPost,
  getPostBySlug,
  updatePost,
  publishPost,
  archivePost,
  calculateReadingTime,
};
