import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../schemas/user.schema.js";
import ExternalProfile from "../schemas/external-profile.schema.js";
import Topic from "../schemas/topic.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import { normalizeExternalAccount, normalizeSkill, syncExternalProfile } from "../services/external-profile.service.js";

const userFields = "username displayName avatar bio headline location website github linkedin reputation candidateProfileVisible openToOpportunities";

const summarizeTopicEvidence = async (userIds) => {
  const rows = await TopicReputation.find({ userId: { $in: userIds }, reputation: { $gt: 0 } })
    .sort({ reputation: -1, eventCount: -1 })
    .populate("topicId", "name slug")
    .lean();

  const byUser = new Map();
  for (const row of rows) {
    if (!row.topicId) continue;
    const key = String(row.userId);
    if (!byUser.has(key)) byUser.set(key, []);
    if (byUser.get(key).length < 8) {
      byUser.get(key).push({
        topic: row.topicId.slug,
        name: row.topicId.name,
        reputation: row.reputation,
        eventCount: row.eventCount,
      });
    }
  }
  return byUser;
};

const getMyDeveloperProfile = asyncHandler(async (req, res) => {
  const [user, accounts] = await Promise.all([
    User.findById(req.user.id).select(userFields).lean(),
    ExternalProfile.find({ userId: req.user.id }).sort({ platform: 1 }).lean(),
  ]);
  return res.status(200).json(new ApiResponse(200, { user, accounts }, "Developer profile fetched"));
});

const upsertMyAccount = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const normalized = normalizeExternalAccount(platform, req.body?.handle);
  const visibility = req.body?.visibility === "hidden" ? "hidden" : "public";

  const account = await ExternalProfile.findOneAndUpdate(
    { userId: req.user.id, platform },
    {
      $set: {
        handle: normalized.handle,
        profileUrl: normalized.profileUrl,
        visibility,
        verificationStatus: "linked",
        verificationNote: normalized.supportsSync
          ? "Profile saved. Sync to verify public metrics."
          : "Profile link saved. Automatic verification is not available for this platform.",
        metrics: {},
        skills: [],
        skillSignals: [],
        lastSyncedAt: null,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  if (normalized.supportsSync && req.body?.sync !== false) {
    try {
      await syncExternalProfile(account);
    } catch {
      // The saved link remains available with a failed sync state and a useful note.
    }
  }

  return res.status(200).json(new ApiResponse(200, account, "Developer account saved"));
});

const syncMyAccount = asyncHandler(async (req, res) => {
  const account = await ExternalProfile.findOne({ userId: req.user.id, platform: req.params.platform });
  if (!account) throw new ApiError(404, "Developer account not linked");
  await syncExternalProfile(account);
  return res.status(200).json(new ApiResponse(200, account, "Developer account synced"));
});

const deleteMyAccount = asyncHandler(async (req, res) => {
  await ExternalProfile.deleteOne({ userId: req.user.id, platform: req.params.platform });
  return res.status(200).json(new ApiResponse(200, {}, "Developer account removed"));
});

const getPublicDeveloperProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: String(req.params.username || "").toLowerCase() })
    .select(userFields)
    .lean();
  if (!user) throw new ApiError(404, "Developer not found");

  const [accounts, topicEvidence] = await Promise.all([
    ExternalProfile.find({ userId: user._id, visibility: "public" }).sort({ platform: 1 }).lean(),
    summarizeTopicEvidence([user._id]),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    user,
    accounts,
    topicEvidence: topicEvidence.get(String(user._id)) || [],
  }, "Developer profile fetched"));
});

const listCandidates = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const q = String(req.query.q || "").trim().slice(0, 80);
  const skill = normalizeSkill(req.query.skill);
  const platform = String(req.query.platform || "").trim().toLowerCase();

  const userFilter = { candidateProfileVisible: true, username: { $exists: true, $ne: null } };
  if (q) {
    const escaped = q.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    userFilter.$or = [{ username: regex }, { displayName: regex }, { headline: regex }, { location: regex }];
  }

  let evidenceUserIds = null;
  if (skill) {
    const [profiles, topic] = await Promise.all([
      ExternalProfile.find({ visibility: "public", skills: skill }).distinct("userId"),
      Topic.findOne({ slug: skill }).select("_id").lean(),
    ]);
    const ids = new Set(profiles.map(String));
    if (topic) {
      const topicUsers = await TopicReputation.find({ topicId: topic._id, reputation: { $gt: 0 } }).distinct("userId");
      for (const id of topicUsers) ids.add(String(id));
    }
    evidenceUserIds = [...ids];
  }

  if (platform) {
    const profileQuery = { visibility: "public", platform };
    if (skill) profileQuery.skills = skill;
    const ids = await ExternalProfile.find(profileQuery).distinct("userId");
    const platformIds = new Set(ids.map(String));
    evidenceUserIds = evidenceUserIds === null
      ? [...platformIds]
      : evidenceUserIds.filter((id) => platformIds.has(String(id)));
  }

  if (evidenceUserIds !== null) userFilter._id = { $in: evidenceUserIds };

  const [users, total] = await Promise.all([
    User.find(userFilter)
      .select(userFields)
      .sort({ reputation: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(userFilter),
  ]);

  const userIds = users.map((user) => user._id);
  const [accounts, topicEvidence] = await Promise.all([
    ExternalProfile.find({ userId: { $in: userIds }, visibility: "public" }).sort({ platform: 1 }).lean(),
    summarizeTopicEvidence(userIds),
  ]);

  const accountMap = new Map();
  for (const account of accounts) {
    const key = String(account.userId);
    if (!accountMap.has(key)) accountMap.set(key, []);
    accountMap.get(key).push(account);
  }

  const items = users.map((user) => ({
    user,
    accounts: accountMap.get(String(user._id)) || [],
    topicEvidence: topicEvidence.get(String(user._id)) || [],
  }));

  return res.status(200).json(new ApiResponse(200, {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  }, "Candidate profiles fetched"));
});

export {
  getMyDeveloperProfile,
  upsertMyAccount,
  syncMyAccount,
  deleteMyAccount,
  getPublicDeveloperProfile,
  listCandidates,
};
