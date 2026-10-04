import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import SalaryContribution from "../schemas/salary-contribution.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const validMoney = (value) => Number.isFinite(value) && value >= 0 && value <= 1000000000;

const create = asyncHandler(async (req, res) => {
  const { company, role, location, year, yearsOfExperience, base, bonus = 0, stock = 0 } = req.body || {};
  const companySlug = slugify(company);
  const roleSlug = slugify(role);
  const locationKey = String(location || "").trim().toLowerCase();
  if (!companySlug || !roleSlug || !locationKey || companySlug.length > 160 ||
      roleSlug.length > 160 || locationKey.length > 120 ||
      !Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() ||
      !Number.isFinite(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 40 ||
      !validMoney(base) || base === 0 || !validMoney(bonus) || !validMoney(stock)) {
    throw new ApiError(400, "Check company, role, location, year, experience and annual INR compensation");
  }
  try {
    await SalaryContribution.create({
      company: String(company).trim(), companySlug, role: String(role).trim(), roleSlug,
      location: String(location).trim(), locationKey,
      year, yearsOfExperience, base, bonus, stock, authorId: req.user.id,
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "You already contributed for this company, role and year");
    throw error;
  }
  return res.status(201).json(new ApiResponse(201, {}, "Salary contribution recorded privately"));
});

const insights = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.company) filter.companySlug = slugify(req.query.company);
  if (req.query.role) filter.roleSlug = slugify(req.query.role);
  if (req.query.location) filter.locationKey = String(req.query.location).trim().toLowerCase().slice(0, 120);
  const rows = await SalaryContribution.aggregate([
    { $match: filter },
    { $addFields: { experienceBucket: { $multiply: [{ $floor: { $divide: ["$yearsOfExperience", 3] } }, 3] } } },
    { $group: {
      _id: { company: "$companySlug", role: "$roleSlug", location: "$locationKey", experienceBucket: "$experienceBucket" },
      authors: { $addToSet: "$authorId" }, base: { $avg: "$base" }, bonus: { $avg: "$bonus" }, stock: { $avg: "$stock" },
    } },
    { $addFields: { contributors: { $size: "$authors" } } },
    { $match: { contributors: { $gte: 3 } } },
    { $sort: { contributors: -1 } }, { $limit: 50 },
  ]);
  const round = (amount) => Math.round(amount / 10000) * 10000;
  return res.status(200).json(new ApiResponse(200, rows.map((row) => ({
    company: row._id.company, role: row._id.role, location: row._id.location,
    experienceFrom: row._id.experienceBucket, experienceTo: row._id.experienceBucket + 2,
    contributors: row.contributors, currency: "INR",
    averageBase: round(row.base), averageBonus: round(row.bonus), averageStock: round(row.stock),
  })), "Salary insights fetched"));
});

export { create, insights };
