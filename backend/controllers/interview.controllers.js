import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import InterviewExperience from "../schemas/interview-experience.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const create = asyncHandler(async (req, res) => {
  const { company, role, date, difficulty, outcome, rounds, summary } = req.body || {};
  const companySlug = slugify(company);
  const when = new Date(date);
  if (!companySlug || companySlug.length > 160 || !String(role || "").trim() ||
      String(role).length > 160 || !Number.isFinite(when.getTime()) ||
      when > new Date() || !["easy", "medium", "hard"].includes(difficulty) ||
      !["offer", "rejected", "withdrew", "pending"].includes(outcome) ||
      !String(summary || "").trim() || String(summary).length > 4000 ||
      !Array.isArray(rounds) || rounds.length < 1 || rounds.length > 12 ||
      rounds.some((round) => !String(round?.name || "").trim() ||
        String(round.name).length > 100 || String(round.details || "").length > 2000)) {
    throw new ApiError(400, "Check the company, role, date, rounds, outcome, and summary");
  }
  const item = await InterviewExperience.create({
    company: String(company).trim(), companySlug, role: String(role).trim(),
    date: when, difficulty, outcome, summary: String(summary).trim(),
    rounds: rounds.map((round) => ({
      name: String(round.name).trim(), details: String(round.details || "").trim(),
    })),
    authorId: req.user.id,
  });
  return res.status(201).json(new ApiResponse(201, item, "Interview experience shared"));
});

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const filter = {};
  if (req.query.company) filter.companySlug = slugify(req.query.company);
  if (req.query.role) {
    const role = String(req.query.role).trim().slice(0, 80).replace(/[^a-z0-9 -]/gi, "");
    if (role) filter.role = { $regex: role, $options: "i" };
  }
  const [items, total] = await Promise.all([
    InterviewExperience.find(filter).sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate("authorId", "username displayName avatar"),
    InterviewExperience.countDocuments(filter),
  ]);
  return res.status(200).json(new ApiResponse(200,
    { items, total, page, hasMore: page < 50 && page * limit < total }, "Interview experiences fetched"));
});

export { create, list };
