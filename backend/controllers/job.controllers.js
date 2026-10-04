import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../schemas/job.schema.js";
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

export { preview, publish };
