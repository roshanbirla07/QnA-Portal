import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Project from "../schemas/project.schema.js";
import ProjectApplication from "../schemas/project-application.schema.js";
import Community from "../schemas/community.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const assertId = (id) => { if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id"); };

const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === "open") filter.status = "open";
  if (req.query.tag) filter.tags = slugify(String(req.query.tag).slice(0, 60));
  if (req.query.community) {
    const community = await Community.findOne({ slug: String(req.query.community) }).select("_id");
    if (!community) return res.status(200).json(new ApiResponse(200, { items: [], total: 0 }, "Projects fetched"));
    filter.communityId = community._id;
  }
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const [items, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20)
      .populate("ownerId", "username displayName headline reputation")
      .populate("communityId", "name slug"),
    Project.countDocuments(filter),
  ]);
  return res.status(200).json(new ApiResponse(200, { items, total, page, hasMore: page < 50 && page * 20 < total }, "Projects fetched"));
});

const getById = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const project = await Project.findById(req.params.id)
    .populate("ownerId", "username displayName headline reputation")
    .populate("communityId", "name slug");
  if (!project) throw new ApiError(404, "Project not found");
  const accepted = await ProjectApplication.find({ projectId: project._id, status: "accepted" })
    .populate("applicantId", "username displayName headline").limit(50);
  return res.status(200).json(new ApiResponse(200, { project, contributors: accepted.map((row) => row.applicantId) }, "Project fetched"));
});

const create = asyncHandler(async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const repositoryUrl = String(req.body?.repositoryUrl || "").trim();
  const tags = Array.isArray(req.body?.tags) ? [...new Set(req.body.tags.map(slugify))] : [];
  if (!title || title.length > 180 || !description || description.length > 4000 ||
      tags.length > 8 || tags.some((tag) => !tag || tag.length > 60) || repositoryUrl.length > 2048) {
    throw new ApiError(400, "Check the title, description and tags");
  }
  if (repositoryUrl) {
    let url;
    try { url = new URL(repositoryUrl); } catch { throw new ApiError(400, "Invalid repository URL"); }
    if (url.protocol !== "https:") throw new ApiError(400, "Repository URL must use HTTPS");
  }
  let communityId = null;
  if (req.body?.communitySlug) {
    const community = await Community.findOne({ slug: String(req.body.communitySlug) }).select("_id");
    if (!community) throw new ApiError(404, "Community not found");
    communityId = community._id;
  }
  const project = await Project.create({ title, description, repositoryUrl, tags, communityId, ownerId: req.user.id });
  return res.status(201).json(new ApiResponse(201, project, "Project shared"));
});

const updateStatus = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  if (!["open", "closed"].includes(req.body?.status)) throw new ApiError(400, "Invalid status");
  const item = await Project.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id },
    { $set: { status: req.body.status } }, { new: true });
  if (!item) throw new ApiError(404, "Your project was not found");
  return res.status(200).json(new ApiResponse(200, item, "Project updated"));
});

const apply = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const project = await Project.findOne({ _id: req.params.id, status: "open" }).select("ownerId");
  if (!project) throw new ApiError(404, "Open project not found");
  if (String(project.ownerId) === req.user.id) throw new ApiError(400, "Cannot apply to your own project");
  const note = String(req.body?.note || "").trim();
  if (!note || note.length > 1000) throw new ApiError(400, "Add a short collaboration note");
  try {
    const item = await ProjectApplication.create({ projectId: project._id, applicantId: req.user.id, note });
    return res.status(201).json(new ApiResponse(201, item, "Collaboration request sent"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "You already requested to join this project");
    throw error;
  }
});

const inbox = asyncHandler(async (req, res) => {
  const owned = await Project.find({ ownerId: req.user.id }).select("_id").limit(100);
  const [received, sent] = await Promise.all([
    ProjectApplication.find({ projectId: { $in: owned.map((item) => item._id) } }).sort({ createdAt: -1 }).limit(100)
      .populate("applicantId", "username displayName headline reputation")
      .populate("projectId", "title status"),
    ProjectApplication.find({ applicantId: req.user.id }).sort({ createdAt: -1 }).limit(100)
      .populate("projectId", "title status"),
  ]);
  return res.status(200).json(new ApiResponse(200, { owned: owned.map((item) => String(item._id)), received, sent }, "Collaboration requests fetched"));
});

const respond = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const status = req.body?.status;
  if (!["accepted", "declined", "withdrawn"].includes(status)) throw new ApiError(400, "Invalid response");
  const application = await ProjectApplication.findById(req.params.id).populate("projectId", "ownerId status");
  if (!application || application.status !== "pending") throw new ApiError(404, "Pending request not found");
  const actorId = status === "withdrawn" ? application.applicantId : application.projectId?.ownerId;
  if (String(actorId) !== req.user.id) throw new ApiError(403, "Not your request");
  if (status === "accepted" && application.projectId?.status !== "open") throw new ApiError(409, "Project is closed");
  const item = await ProjectApplication.findOneAndUpdate({ _id: application._id, status: "pending" },
    { $set: { status, respondedAt: new Date() } }, { new: true });
  if (!item) throw new ApiError(409, "Request was already updated");
  return res.status(200).json(new ApiResponse(200, item, "Collaboration request updated"));
});

export { list, getById, create, updateStatus, apply, inbox, respond };
