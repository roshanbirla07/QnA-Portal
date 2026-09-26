import ReputationEvent from "../schemas/reputation-event.schema.js";
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

  await User.updateOne(
    { _id: userId },
    { $inc: { reputation: points } }
  );

  return event;
};

const getUserReputationLedger = async ({ userId, limit = 50 }) => {
  const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [user, events] = await Promise.all([
    User.findById(userId).select("reputation"),
    ReputationEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(boundedLimit)
      .lean(),
  ]);

  if (!user) throw new ApiError(404, "User not found");

  return {
    reputation: user.reputation || 0,
    events,
  };
};

export {
  ensureVoteCanAffectReputation,
  recordVoteReputationEvent,
  getUserReputationLedger,
};
