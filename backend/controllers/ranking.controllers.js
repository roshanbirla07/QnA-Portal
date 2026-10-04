import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ReputationEvent from "../schemas/reputation-event.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import Topic from "../schemas/topic.schema.js";
import User from "../schemas/user.schema.js";
import Post from "../schemas/post.schema.js";
import Answer from "../schemas/answer.schema.js";

const badgesFor = ({ reputation, posts, acceptedAnswers, topicPoints }) => [
  ...(posts >= 1 ? ["First contribution"] : []),
  ...(posts >= 10 ? ["Regular contributor"] : []),
  ...(acceptedAnswers >= 1 ? ["Accepted answer"] : []),
  ...(acceptedAnswers >= 10 ? ["Trusted mentor"] : []),
  ...(reputation >= 50 ? ["Helpful member"] : []),
  ...(topicPoints >= 50 ? ["Topic specialist"] : []),
];
const trustLevel = (points) => points >= 200 ? "Guide" : points >= 50 ? "Contributor" : points >= 10 ? "Member" : "Newcomer";

const list = asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(400, "Invalid month");
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const topicSlug = String(req.query.topic || "").trim().toLowerCase();
  if (topicSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicSlug)) throw new ApiError(400, "Invalid topic");
  const topic = topicSlug ? await Topic.findOne({ slug: topicSlug }).select("_id name slug") : null;
  if (topicSlug && !topic) throw new ApiError(404, "Topic not found");

  const [monthRows, reputationRows, topicRows] = await Promise.all([
    ReputationEvent.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$userId", points: { $sum: "$points" }, activity: { $sum: 1 } } },
      { $sort: { points: -1, activity: -1 } }, { $limit: 50 },
    ]),
    User.find().sort({ reputation: -1 }).limit(50).select("username displayName avatar headline reputation").lean(),
    TopicReputation.aggregate([
      { $match: topic ? { topicId: topic._id } : {} },
      { $group: { _id: "$userId", reputation: { $max: "$reputation" } } },
      { $sort: { reputation: -1 } }, { $limit: 50 },
      { $project: { _id: 0, userId: "$_id", reputation: 1 } },
    ]),
  ]);
  const ids = [...new Set([...monthRows.map((row) => String(row._id)),
    ...reputationRows.map((row) => String(row._id)), ...topicRows.map((row) => String(row.userId))])];
  const [users, posts, accepted] = await Promise.all([
    User.find({ _id: { $in: ids } }).select("username displayName avatar headline reputation").lean(),
    Post.aggregate([{ $match: { author: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }, status: "published" } },
      { $group: { _id: "$author", count: { $sum: 1 } } }]),
    Answer.aggregate([{ $match: { authorId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }, status: "published", accepted: true } },
      { $group: { _id: "$authorId", count: { $sum: 1 } } }]),
  ]);
  const people = new Map(users.map((user) => [String(user._id), user]));
  const postCounts = new Map(posts.map((row) => [String(row._id), row.count]));
  const acceptedCounts = new Map(accepted.map((row) => [String(row._id), row.count]));
  const topicPoints = new Map(topicRows.map((row) => [String(row.userId), row.reputation]));
  const decorate = (id, points) => {
    const user = people.get(String(id));
    if (!user) return null;
    const stats = { reputation: user.reputation || 0, posts: postCounts.get(String(id)) || 0,
      acceptedAnswers: acceptedCounts.get(String(id)) || 0, topicPoints: topicPoints.get(String(id)) || 0 };
    return { userId: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar,
      headline: user.headline, ...stats, points, trustLevel: trustLevel(stats.reputation), badges: badgesFor(stats) };
  };
  const monthly = monthRows.map((row) => decorate(row._id, row.points)).filter(Boolean);
  const allTime = reputationRows.map((row) => decorate(row._id, row.reputation)).filter(Boolean);
  const topicLeaders = topicRows.map((row) => decorate(row.userId, row.reputation)).filter(Boolean);
  return res.status(200).json(new ApiResponse(200, { month, topic, monthly, allTime, topicLeaders,
    spotlight: monthly.filter((entry) => entry.points > 0).slice(0, 3).map((entry) => entry.userId) }, "Rankings fetched"));
});

export { list };
