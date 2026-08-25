import Follow from "../schemas/follow.schema.js";
import Post from "../schemas/post.schema.js";
import ApiError from "../utils/ApiError.js";

const parseLimit = (value) => Math.min(Math.max(Number(value) || 20, 1), 50);

const buildCursorFilter = (cursor) => {
  if (!cursor) return {};
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Invalid cursor");
  return { createdAt: { $lt: date } };
};

const listFeed = async ({ query }) => {
  const limit = parseLimit(query.limit);
  const filter = {
    status: "published",
    ...buildCursorFilter(query.cursor),
  };

  if (query.type) {
    if (!["question", "article"].includes(query.type)) throw new ApiError(400, "Invalid post type");
    filter.type = query.type;
  }
  if (query.tag) filter.tags = String(query.tag).trim().toLowerCase();

  let sort = { createdAt: -1 };
  if (query.sort === "top") sort = { score: -1, createdAt: -1 };
  if (query.sort === "trending") sort = { score: -1, commentCount: -1, views: -1, createdAt: -1 };

  const posts = await Post.find(filter)
    .populate("author", "email username displayName avatar headline")
    .sort(sort)
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;
  return { items: page, nextCursor };
};

const listFollowingFeed = async ({ userId, query }) => {
  const following = await Follow.find({ followerId: userId }).select("followingId");
  const followingIds = following.map((row) => row.followingId);
  if (!followingIds.length) return { items: [], nextCursor: null };

  const limit = parseLimit(query.limit);
  const filter = {
    author: { $in: followingIds },
    status: "published",
    ...buildCursorFilter(query.cursor),
  };

  const posts = await Post.find(filter)
    .populate("author", "email username displayName avatar headline")
    .sort({ createdAt: -1 })
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
  };
};

const searchPosts = async ({ query }) => {
  const q = String(query.q || "").trim();
  if (!q) throw new ApiError(400, "Search query is required");
  const limit = parseLimit(query.limit);
  const filter = { status: "published", $text: { $search: q } };
  if (query.type) filter.type = query.type;

  const posts = await Post.find(filter, { scoreText: { $meta: "textScore" } })
    .populate("author", "email username displayName avatar")
    .sort({ scoreText: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit);
  return posts;
};

export { listFeed, listFollowingFeed, searchPosts };
