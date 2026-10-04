import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Post from "../schemas/post.schema.js";
import ReferralOffer from "../schemas/referral-offer.schema.js";
import ReferralRequest from "../schemas/referral-request.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const validId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");
};

const offers = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.company) filter.companySlug = slugify(String(req.query.company).slice(0, 160));
  const items = await ReferralOffer.find(filter).sort({ createdAt: -1 }).limit(50)
    .populate("employeeId", "username displayName headline reputation");
  return res.status(200).json(new ApiResponse(200, items, "Referral volunteers fetched"));
});

const optIn = asyncHandler(async (req, res) => {
  const company = String(req.body?.company || "").trim();
  const companySlug = slugify(company);
  const note = String(req.body?.note || "").trim();
  if (!companySlug || company.length > 160 || note.length > 500) {
    throw new ApiError(400, "Provide a company and an optional short note");
  }
  // Opt-in is a self-declaration. Employment is never labeled verified.
  const offer = await ReferralOffer.findOneAndUpdate({ employeeId: req.user.id, companySlug },
    { $set: { company, note, active: true } }, { upsert: true, new: true, runValidators: true });
  return res.status(200).json(new ApiResponse(200, offer, "Referral availability saved"));
});

const setAvailability = asyncHandler(async (req, res) => {
  validId(req.params.id);
  if (typeof req.body?.active !== "boolean") throw new ApiError(400, "Provide availability");
  const offer = await ReferralOffer.findOneAndUpdate({ _id: req.params.id, employeeId: req.user.id },
    { $set: { active: req.body.active } }, { new: true });
  if (!offer) throw new ApiError(404, "Referral offer not found");
  return res.status(200).json(new ApiResponse(200, offer, "Availability updated"));
});

const request = asyncHandler(async (req, res) => {
  validId(req.params.id);
  const offer = await ReferralOffer.findOne({ _id: req.params.id, active: true });
  if (!offer) throw new ApiError(404, "Referral volunteer not available");
  if (String(offer.employeeId) === req.user.id) throw new ApiError(400, "Cannot request your own referral");
  const note = String(req.body?.note || "").trim();
  const jobUrl = String(req.body?.jobUrl || "").trim();
  let url;
  try { url = new URL(jobUrl); } catch { throw new ApiError(400, "Provide a valid job URL"); }
  if (!["https:", "http:"].includes(url.protocol) || jobUrl.length > 2048 || !note || note.length > 1000) {
    throw new ApiError(400, "Provide a job URL and a short request note");
  }
  try {
    const item = await ReferralRequest.create({ offerId: offer._id, candidateId: req.user.id,
      jobUrl: url.toString(), note });
    return res.status(201).json(new ApiResponse(201, item, "Referral request sent"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "You already requested this volunteer");
    throw error;
  }
});

const mine = asyncHandler(async (req, res) => {
  const myOffers = await ReferralOffer.find({ employeeId: req.user.id }).sort({ createdAt: -1 }).limit(30);
  const [received, sent] = await Promise.all([
    ReferralRequest.find({ offerId: { $in: myOffers.map((offer) => offer._id) } })
      .sort({ createdAt: -1 }).limit(50)
      .populate("candidateId", "username displayName headline bio github linkedin reputation")
      .populate("offerId", "company active"),
    ReferralRequest.find({ candidateId: req.user.id }).sort({ createdAt: -1 }).limit(50)
      .populate({ path: "offerId", select: "company employeeId", populate: { path: "employeeId", select: "username displayName" } }),
  ]);
  const candidateIds = received.map((item) => item.candidateId?._id).filter(Boolean);
  const contributions = candidateIds.length ? await Post.aggregate([
    { $match: { author: { $in: candidateIds }, status: "published" } },
    { $group: { _id: "$author", publishedPosts: { $sum: 1 } } },
  ]) : [];
  const postCounts = new Map(contributions.map((row) => [String(row._id), row.publishedPosts]));
  return res.status(200).json(new ApiResponse(200, { offers: myOffers,
    received: received.map((item) => ({ ...item.toObject(), publishedPosts: postCounts.get(String(item.candidateId?._id)) || 0 })),
    sent }, "Referral inbox fetched"));
});

const respond = asyncHandler(async (req, res) => {
  validId(req.params.id);
  const status = req.body?.status;
  if (!["accepted", "declined", "canceled"].includes(status)) throw new ApiError(400, "Invalid response");
  const current = await ReferralRequest.findById(req.params.id).populate("offerId", "employeeId");
  if (!current || current.status !== "pending") throw new ApiError(404, "Pending request not found");
  const actorId = status === "canceled" ? current.candidateId : current.offerId?.employeeId;
  if (String(actorId) !== req.user.id) throw new ApiError(403, "Not your request");
  const item = await ReferralRequest.findOneAndUpdate({ _id: current._id, status: "pending" },
    { $set: { status, respondedAt: new Date() } }, { new: true });
  if (!item) throw new ApiError(409, "Request was already updated");
  return res.status(200).json(new ApiResponse(200, item, "Referral request updated"));
});

export { offers, optIn, setAvailability, request, mine, respond };
