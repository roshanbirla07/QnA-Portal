import Answer from "../schemas/answer.schema.js";
import Post from "../schemas/post.schema.js";
import Topic from "../schemas/topic.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";
import { normalizeTopicSlug } from "./topic.service.js";

const discoverExperts = async ({ topicSlug, limit = 20 }) => {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);
  let topic = null;
  if (topicSlug) {
    const slug = normalizeTopicSlug(topicSlug);
    if (!slug) throw new ApiError(400, "Invalid topic");
    topic = await Topic.findOne({ slug }).select("_id slug name").lean();
    if (!topic) throw new ApiError(404, "Topic not found");
  }

  const topicFilter = topic ? { tags: topic.slug } : {};
  const [reputation, accepted, contributions] = await Promise.all([
    TopicReputation.aggregate([
      { $match: topic ? { topicId: topic._id } : {} },
      { $group: { _id: "$userId", points: { $sum: "$reputation" }, events: { $sum: "$eventCount" } } },
      { $sort: { points: -1, events: -1 } }, { $limit: 100 },
    ]),
    Answer.aggregate([
      { $match: { status: "published", accepted: true } },
      { $lookup: { from: Post.collection.name, localField: "questionId", foreignField: "_id", as: "question" } },
      { $unwind: "$question" },
      { $match: { "question.status": "published", ...(topic ? { "question.tags": topic.slug } : {}) } },
      { $group: { _id: "$authorId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 100 },
    ]),
    Post.aggregate([
      { $match: { status: "published", ...topicFilter } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 100 },
    ]),
  ]);

  const scores = new Map();
  const metric = (id) => {
    const key = String(id);
    if (!scores.has(key)) scores.set(key, { reputation: 0, acceptedAnswers: 0, contributions: 0 });
    return scores.get(key);
  };
  for (const row of reputation) metric(row._id).reputation = row.points;
  for (const row of accepted) metric(row._id).acceptedAnswers = row.count;
  for (const row of contributions) metric(row._id).contributions = row.count;

  const users = await User.find({ _id: { $in: [...scores.keys()] } })
    .select("username displayName avatar headline bio reputation").lean();
  const experts = users.map((user) => {
    const stats = scores.get(String(user._id));
    return {
      userId: user._id, username: user.username, displayName: user.displayName,
      avatar: user.avatar, headline: user.headline, bio: user.bio,
      ...stats, score: stats.reputation + 10 * stats.acceptedAnswers + stats.contributions,
    };
  }).sort((a, b) => b.score - a.score || b.acceptedAnswers - a.acceptedAnswers)
    .slice(0, safeLimit);

  return { topic, experts };
};

export { discoverExperts };
