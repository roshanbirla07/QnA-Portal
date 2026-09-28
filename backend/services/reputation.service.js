import Answer from "../schemas/answer.schema.js";
import Post from "../schemas/post.schema.js";
import ReputationEvent from "../schemas/reputation-event.schema.js";
import Topic from "../schemas/topic.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";

const resolveTargetOwnerId = (targetType, target) => {
  if (targetType === "post") return target.author;
  if (targetType === "answer") return target.authorId;
  throw new ApiError(400, "Invalid reputation source type");
};

const ensureVoteCanAffectReputation = ({ actorId, targetType, target }) => {
  const ownerId = resolveTargetOwnerId(targetType, target);
  if (String(ownerId) === String(actorId)) {
    throw new ApiError(400, "You cannot vote on your own content");
  }
  return ownerId;
};

const getSourceTopicSlugs = async ({ targetType, target }) => {
  if (targetType === "post") {
    const post = target.tags ? target : await Post.findById(target._id).select("tags");
    return post?.tags || [];
  }

  const answer = target.questionId
    ? target
    : await Answer.findById(target._id).select("questionId");
  if (!answer?.questionId) return [];

  const question = await Post.findById(answer.questionId).select("tags");
  return question?.tags || [];
};

const applyTopicReputationDelta = async ({ userId, targetType, target, points }) => {
  const slugs = [...new Set((await getSourceTopicSlugs({ targetType, target }))
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean))];

  if (!slugs.length || points === 0) return;

  const topics = await Topic.find({ slug: { $in: slugs } }).select("_id slug");
  await Promise.all(topics.map((topic) => TopicReputation.updateOne(
    { userId, topicId: topic._id },
    {
      $inc: { reputation: points, eventCount: 1 },
      $setOnInsert: { userId, topicId: topic._id },
    },
    { upsert: true }
  )));
};

const recordVoteReputationEvent = async ({
  actorId,
  targetType,
  target,
  previousValue,
  nextValue,
}) => {
  const userId = ensureVoteCanAffectReputation({ actorId, targetType, target });
  const points = Number(nextValue) - Number(previousValue);

  if (points === 0) return null;

  const event = await ReputationEvent.create({
    userId,
    actorId,
    eventType: "vote_changed",
    sourceType: targetType,
    sourceId: target._id,
    previousValue,
    nextValue,
    points,
  });

  await Promise.all([
    User.updateOne({ _id: userId }, { $inc: { reputation: points } }),
    applyTopicReputationDelta({ userId, targetType, target, points }),
  ]);

  return event;
};

const getUserReputationLedger = async ({ userId, limit = 50 }) => {
  const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [user, events, topicReputation] = await Promise.all([
    User.findById(userId).select("reputation"),
    ReputationEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(boundedLimit)
      .lean(),
    TopicReputation.find({ userId })
      .populate("topicId", "name slug")
      .sort({ reputation: -1, eventCount: -1 })
      .lean(),
  ]);

  if (!user) throw new ApiError(404, "User not found");

  return {
    reputation: user.reputation || 0,
    topicReputation,
    events,
  };
};

export {
  ensureVoteCanAffectReputation,
  recordVoteReputationEvent,
  getUserReputationLedger,
};
