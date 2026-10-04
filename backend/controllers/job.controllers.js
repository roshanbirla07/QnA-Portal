import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../schemas/job.schema.js";
import mongoose from "mongoose";
import { normalizeJobUrl, previewJob } from "../services/job-preview.service.js";

const preview = asyncHandler(async (req, res) => {
  const metadata = await previewJob(req.body?.url);
  return res.status(200).json(new ApiResponse(200, metadata, "Review the job details before publishing"));
});

const publish = asyncHandler(async (req, res) => {
  const sourceUrl = normalizeJobUrl(req.body?.sourceUrl).toString();
  const fields = ["title", "company", "location", "description"];
  const values = Object.fromEntries(fields.map((field) => [field, String(req.body?.[field] || "").trim()]));
  if (!values.title || !values.company || values.title.length > 220 || values.company.length > 160 ||
      values.location.length > 160 || values.description.length > 1000) {
    throw new ApiError(400, "A title and company are required; check field lengths");
  }
  try {
    const job = await Job.create({ sourceUrl, ...values, submittedBy: req.user.id });
    return res.status(201).json(new ApiResponse(201, job, "Job link published"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "This job link has already been shared");
    throw error;
  }
});

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const filter = { status: "published" };
  const q = String(req.query.q || "").trim().slice(0, 80);
  if (q) filter.$text = { $search: q };
  for (const field of ["company", "location"]) {
    const value = String(req.query[field] || "").trim().slice(0, 80).replace(/[^a-z0-9 -]/gi, "");
    if (value) filter[field] = { $regex: value, $options: "i" };
  }
  const [items, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
      .select("title company location description sourceUrl submittedBy createdAt status"),
    Job.countDocuments(filter),
  ]);
  return res.status(200).json(new ApiResponse(200, {
    items, total, page, limit, hasMore: page * limit < total,
  }, "Jobs fetched successfully"));
});

const getById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid job id");
  const job = await Job.findOne({ _id: req.params.id, status: "published" })
    .populate("submittedBy", "username displayName");
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job, "Job fetched successfully"));
});

export { preview, publish, list, getById };
