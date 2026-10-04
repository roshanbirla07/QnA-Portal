import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CompanyReview from "../schemas/company-review.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const create = asyncHandler(async (req, res) => {
  const { company, role, employment, rating, headline, pros, cons } = req.body || {};
  const companySlug = slugify(company);
  const text = [role, headline, pros, cons];
  if (!companySlug || companySlug.length > 160 ||
      !text.every((value) => typeof value === "string" && value.trim()) ||
      String(role).length > 160 || String(headline).length > 180 ||
      String(pros).length > 2000 || String(cons).length > 2000 ||
      !["current", "former"].includes(employment) ||
      !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Check the company, role, rating, pros and cons");
  }
  try {
    const review = await CompanyReview.create({
      company: String(company).trim(), companySlug, role: role.trim(), employment,
      rating, headline: headline.trim(), pros: pros.trim(), cons: cons.trim(),
      authorId: req.user.id,
    });
    return res.status(201).json(new ApiResponse(201, review, "Company review shared"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "You have already reviewed this company");
    throw error;
  }
});

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const filter = req.query.company ? { companySlug: slugify(req.query.company) } : {};
  const [items, total] = await Promise.all([
    CompanyReview.find(filter).sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate("authorId", "username displayName avatar"),
    CompanyReview.countDocuments(filter),
  ]);
  return res.status(200).json(new ApiResponse(200,
    { items, total, page, hasMore: page < 50 && page * limit < total }, "Company reviews fetched"));
});

const verify = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid review id");
  if (!["verified", "unverified"].includes(req.body?.status)) throw new ApiError(400, "Invalid verification status");
  const review = await CompanyReview.findByIdAndUpdate(req.params.id, {
    $set: {
      verificationStatus: req.body.status,
      verifiedAt: req.body.status === "verified" ? new Date() : null,
    },
  }, { new: true });
  if (!review) throw new ApiError(404, "Review not found");
  return res.status(200).json(new ApiResponse(200, review, "Verification status updated"));
});

export { create, list, verify };
