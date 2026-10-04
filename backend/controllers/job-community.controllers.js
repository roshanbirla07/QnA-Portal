import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../schemas/job.schema.js";
import JobComment from "../schemas/job-comment.schema.js";
import JobSignal from "../schemas/job-signal.schema.js";

const kinds = ["saved", "applied", "still_open", "got_interview", "closed", "incorrect"];
const assertJob = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid job id");
  const exists = await Job.exists({ _id: id, status: "published" });
  if (!exists) throw new ApiError(404, "Job not found");
};

const community = asyncHandler(async (req, res) => {
  await assertJob(req.params.id);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const jobId = new mongoose.Types.ObjectId(req.params.id);
  const [comments, total, signals] = await Promise.all([
    JobComment.find({ jobId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20)
      .populate("authorId", "username displayName avatar"),
    JobComment.countDocuments({ jobId }),
    JobSignal.aggregate([{ $match: { jobId } }, { $group: { _id: "$kind", count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(kinds.map((kind) => [kind, 0]));
  for (const signal of signals) counts[signal._id] = signal.count;
  return res.status(200).json(new ApiResponse(200,
    { comments, total, page, hasMore: page < 50 && page * 20 < total, signals: counts },
    "Job discussion fetched"));
});

const comment = asyncHandler(async (req, res) => {
  await assertJob(req.params.id);
  const text = req.body?.text;
  if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) {
    throw new ApiError(400, "Comment must be between 1 and 2000 characters");
  }
  const item = await JobComment.create({ jobId: req.params.id, authorId: req.user.id, text: text.trim() });
  return res.status(201).json(new ApiResponse(201, item, "Comment posted"));
});

const mySignals = asyncHandler(async (req, res) => {
  await assertJob(req.params.id);
  const items = await JobSignal.find({ jobId: req.params.id, userId: req.user.id }).select("kind");
  return res.status(200).json(new ApiResponse(200, items.map((item) => item.kind), "Your signals fetched"));
});

const setSignal = asyncHandler(async (req, res) => {
  await assertJob(req.params.id);
  const kind = req.params.kind;
  if (!kinds.includes(kind)) throw new ApiError(400, "Invalid job signal");
  const key = { jobId: req.params.id, userId: req.user.id, kind };
  if (req.method === "DELETE") await JobSignal.deleteOne(key);
  else {
    try { await JobSignal.updateOne(key, { $setOnInsert: key }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
  }
  return res.status(200).json(new ApiResponse(200, { kind, active: req.method !== "DELETE" }, "Signal updated"));
});

export { community, comment, mySignals, setSignal };
