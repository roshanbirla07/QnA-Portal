import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Community from "../schemas/community.schema.js";
import CommunityMember from "../schemas/community-member.schema.js";
import CommunityJob from "../schemas/community-job.schema.js";
import Topic from "../schemas/topic.schema.js";
import Post from "../schemas/post.schema.js";
import Job from "../schemas/job.schema.js";
import { discoverExperts } from "../services/expert.service.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const list = asyncHandler(async (_req, res) => {
  const items = await Community.find().sort({ membersCount: -1, createdAt: -1 }).limit(100)
    .select("name slug description topics membersCount");
  return res.status(200).json(new ApiResponse(200, items, "Communities fetched"));
});

const create = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();
  const slug = slugify(name);
  const topics = Array.isArray(req.body?.topics) ? [...new Set(req.body.topics.map(slugify))] : [];
  if (!slug || name.length > 80 || !description || description.length > 500 ||
      topics.length < 1 || topics.length > 5 || topics.some((topic) => !topic || topic.length > 60)) {
    throw new ApiError(400, "Provide a name, description, and one to five existing topics");
  }
  const existing = await Topic.countDocuments({ slug: { $in: topics } });
  if (existing !== topics.length) throw new ApiError(400, "All topics must exist");
  let item;
  try { item = await Community.create({ name, slug, description, topics, createdBy: req.user.id }); }
  catch (error) {
    if (error.code === 11000) throw new ApiError(409, "Community already exists");
    throw error;
  }
  await CommunityMember.updateOne({ communityId: item._id, userId: req.user.id },
    { $setOnInsert: { communityId: item._id, userId: req.user.id } }, { upsert: true });
  return res.status(201).json(new ApiResponse(201, item, "Community created"));
});

const detail = asyncHandler(async (req, res) => {
  const item = await Community.findOne({ slug: req.params.slug });
  if (!item) throw new ApiError(404, "Community not found");
  const filter = { status: "published", tags: { $in: item.topics } };
  const [questions, articles, jobs, experts] = await Promise.all([
    Post.find({ ...filter, type: "question" }).sort({ createdAt: -1 }).limit(12)
      .select("title slug excerpt tags score answerCount createdAt"),
    Post.find({ ...filter, type: "article" }).sort({ createdAt: -1 }).limit(12)
      .select("title slug excerpt tags score readingTime createdAt"),
    CommunityJob.find({ communityId: item._id }).sort({ createdAt: -1 }).limit(12)
      .populate({ path: "jobId", match: { status: "published" }, select: "title company location sourceUrl" }),
    discoverExperts({ topicSlug: item.topics[0], limit: 8 }),
  ]);
  const result = { ...item.toObject(), questions, articles,
    jobs: jobs.map((row) => row.jobId).filter(Boolean), people: experts.experts };
  return res.status(200).json(new ApiResponse(200, result, "Community fetched"));
});

const membership = asyncHandler(async (req, res) => {
  const item = await Community.findOne({ slug: req.params.slug }).select("_id");
  if (!item) throw new ApiError(404, "Community not found");
  const filter = { communityId: item._id, userId: req.user.id };
  if (req.method === "DELETE") {
    const removed = await CommunityMember.deleteOne(filter);
    if (removed.deletedCount) await Community.updateOne({ _id: item._id, membersCount: { $gt: 0 } }, { $inc: { membersCount: -1 } });
  } else {
    try {
      const result = await CommunityMember.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
      if (result.upsertedCount) await Community.updateOne({ _id: item._id }, { $inc: { membersCount: 1 } });
    } catch (error) { if (error.code !== 11000) throw error; }
  }
  return res.status(200).json(new ApiResponse(200, {}, "Community membership updated"));
});

const mine = asyncHandler(async (req, res) => {
  const memberships = await CommunityMember.find({ userId: req.user.id }).select("communityId");
  return res.status(200).json(new ApiResponse(200, memberships.map((row) => String(row.communityId)), "Memberships fetched"));
});

const shareJob = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body?.jobId)) throw new ApiError(400, "Invalid job id");
  const community = await Community.findOne({ slug: req.params.slug }).select("_id");
  if (!community) throw new ApiError(404, "Community not found");
  const [member, job] = await Promise.all([
    CommunityMember.exists({ communityId: community._id, userId: req.user.id }),
    Job.exists({ _id: req.body.jobId, status: "published" }),
  ]);
  if (!member) throw new ApiError(403, "Join the community first");
  if (!job) throw new ApiError(404, "Job not found");
  const key = { communityId: community._id, jobId: req.body.jobId };
  try { await CommunityJob.updateOne(key, { $setOnInsert: { ...key, sharedBy: req.user.id } }, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; }
  return res.status(200).json(new ApiResponse(200, {}, "Job shared with community"));
});

export { list, create, detail, membership, mine, shareJob };
