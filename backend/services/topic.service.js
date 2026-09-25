import Topic from "../schemas/topic.schema.js";
import TopicFollow from "../schemas/topicFollow.schema.js";
import Post from "../schemas/post.schema.js";
import ApiError from "../utils/ApiError.js";

const normalizeTopicSlug = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const ensureTopics = async (tags = []) => {
  const normalized = [...new Set(tags.map(normalizeTopicSlug).filter(Boolean))];
  if (!normalized.length) return [];

  await Promise.all(normalized.map((slug) => Topic.updateOne(
    { slug },
    { $setOnInsert: { slug, name: slug } },
    { upsert: true }
  )));
  return normalized;
};

const refreshTopicPostCounts = async (slugs = []) => {
  const unique = [...new Set(slugs.map(normalizeTopicSlug).filter(Boolean))];
  await Promise.all(unique.map(async (slug) => {
    const postCount = await Post.countDocuments({ status: "published", tags: slug });
    await Topic.updateOne({ slug }, { $set: { postCount } }, { upsert: true });
  }));
};

const getTopicPage = async ({ slug, sort = "top", type, limit = 20, userId }) => {
  const normalizedSlug = normalizeTopicSlug(slug);
  if (!normalizedSlug) throw new ApiError(400, "Invalid topic");

  const topic = await Topic.findOne({ slug: normalizedSlug });
  if (!topic) throw new ApiError(404, "Topic not found");

  const filter = { status: "published", tags: normalizedSlug };
  if (type) {
    if (!["question", "article"].includes(type)) throw new ApiError(400, "Invalid post type");
    filter.type = type;
  }
  if (sort === "unanswered") {
    filter.type = "question";
    filter.answerCount = 0;
  }

  let ordering = { score: -1, createdAt: -1 };
  if (sort === "newest") ordering = { createdAt: -1 };
  if (sort === "trending") ordering = { score: -1, commentCount: -1, views: -1, createdAt: -1 };
  if (sort === "unanswered") ordering = { createdAt: -1 };

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const posts = await Post.find(filter)
    .populate("author", "email username displayName avatar headline")
    .sort(ordering)
    .limit(safeLimit);

  const isFollowing = userId
    ? Boolean(await TopicFollow.exists({ userId, topicId: topic._id }))
    : false;

  const topContributors = await Post.aggregate([
    { $match: { status: "published", tags: normalizedSlug } },
    { $group: { _id: "$author", score: { $sum: "$score" }, posts: { $sum: 1 } } },
    { $sort: { score: -1, posts: -1 } },
    { $limit: 5 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 0, userId: "$_id", score: 1, posts: 1, username: "$user.username", displayName: "$user.displayName", avatar: "$user.avatar" } },
  ]);

  return { topic, isFollowing, posts, topContributors };
};

const followTopic = async ({ userId, slug }) => {
  const topic = await Topic.findOne({ slug: normalizeTopicSlug(slug) });
  if (!topic) throw new ApiError(404, "Topic not found");

  const result = await TopicFollow.updateOne(
    { userId, topicId: topic._id },
    { $setOnInsert: { userId, topicId: topic._id } },
    { upsert: true }
  );
  if (result.upsertedCount) await Topic.updateOne({ _id: topic._id }, { $inc: { followersCount: 1 } });
  return Topic.findById(topic._id);
};

const unfollowTopic = async ({ userId, slug }) => {
  const topic = await Topic.findOne({ slug: normalizeTopicSlug(slug) });
  if (!topic) throw new ApiError(404, "Topic not found");

  const deleted = await TopicFollow.deleteOne({ userId, topicId: topic._id });
  if (deleted.deletedCount) {
    await Topic.updateOne({ _id: topic._id, followersCount: { $gt: 0 } }, { $inc: { followersCount: -1 } });
  }
  return Topic.findById(topic._id);
};

const listTopics = async ({ q, limit = 30 }) => {
  const filter = q
    ? { $or: [{ name: new RegExp(String(q), "i") }, { slug: new RegExp(String(q), "i") }] }
    : {};
  return Topic.find(filter)
    .sort({ followersCount: -1, postCount: -1, name: 1 })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 100));
};

export { normalizeTopicSlug, ensureTopics, refreshTopicPostCounts, getTopicPage, followTopic, unfollowTopic, listTopics };
