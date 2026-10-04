import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Job from "../schemas/job.schema.js";
import CompanyReview from "../schemas/company-review.schema.js";
import InterviewExperience from "../schemas/interview-experience.schema.js";
import SalaryContribution from "../schemas/salary-contribution.schema.js";

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Jobs predate companySlug. Match their original company names without exposing a free-form regex.
const jobCompanyFilter = (slug) => ({
  status: "published",
  company: { $regex: `^[^a-z0-9]*${slug.split("-").join("[^a-z0-9]+")}[^a-z0-9]*$`, $options: "i" },
});

const directory = asyncHandler(async (_req, res) => {
  const [jobs, reviews, interviews, salaries] = await Promise.all([
    Job.aggregate([{ $match: { status: "published" } }, { $group: { _id: "$company", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 100 }]),
    CompanyReview.aggregate([{ $group: { _id: "$companySlug", name: { $first: "$company" }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 100 }]),
    InterviewExperience.aggregate([{ $group: { _id: "$companySlug", name: { $first: "$company" }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 100 }]),
    SalaryContribution.aggregate([
      { $group: { _id: { company: "$companySlug", role: "$roleSlug", location: "$locationKey" },
        name: { $first: "$company" }, authors: { $addToSet: "$authorId" } } },
      { $match: { "authors.2": { $exists: true } } },
      { $group: { _id: "$_id.company", name: { $first: "$name" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 100 },
    ]),
  ]);
  const companies = new Map();
  const include = (name, slug, kind, count) => {
    if (!slug) return;
    const entry = companies.get(slug) || { slug, name, jobs: 0, reviews: 0, interviews: 0, salaryContributions: 0 };
    entry[kind] += count;
    companies.set(slug, entry);
  };
  jobs.forEach((row) => include(row._id, slugify(row._id), "jobs", row.count));
  reviews.forEach((row) => include(row.name, row._id, "reviews", row.count));
  interviews.forEach((row) => include(row.name, row._id, "interviews", row.count));
  salaries.forEach((row) => include(row.name, row._id, "salaryContributions", row.count));
  const items = [...companies.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 100);
  return res.status(200).json(new ApiResponse(200, items, "Companies fetched"));
});

const detail = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) {
    throw new ApiError(400, "Invalid company slug");
  }
  const jobFilter = jobCompanyFilter(slug);
  const filter = { companySlug: slug };
  const [jobs, reviews, interviews, salaryGroups, counts] = await Promise.all([
    Job.find(jobFilter).sort({ createdAt: -1 }).limit(8)
      .select("title company location sourceUrl verificationStatus createdAt"),
    CompanyReview.find(filter).sort({ createdAt: -1 }).limit(8)
      .select("company role rating headline pros cons verificationStatus createdAt"),
    InterviewExperience.find(filter).sort({ createdAt: -1 }).limit(8)
      .select("company role date difficulty outcome summary rounds createdAt"),
    SalaryContribution.aggregate([
      { $match: filter },
      { $group: { _id: { role: "$roleSlug", location: "$locationKey" },
        contributors: { $addToSet: "$authorId" }, averageBase: { $avg: "$base" },
        averageBonus: { $avg: "$bonus" }, averageStock: { $avg: "$stock" } } },
      { $addFields: { count: { $size: "$contributors" } } },
      { $match: { count: { $gte: 3 } } }, { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { contributors: 0 } },
    ]),
    Promise.all([Job.countDocuments(jobFilter), CompanyReview.countDocuments(filter),
      InterviewExperience.countDocuments(filter)]),
  ]);
  if (!counts.some(Boolean) && !salaryGroups.length && !await SalaryContribution.exists(filter)) {
    throw new ApiError(404, "Company not found");
  }
  const name = reviews[0]?.company || interviews[0]?.company || jobs[0]?.company ||
    (await SalaryContribution.findOne(filter).select("company"))?.company || slug.replace(/-/g, " ");
  return res.status(200).json(new ApiResponse(200, {
    slug, name, counts: { jobs: counts[0], reviews: counts[1], interviews: counts[2] },
    jobs, reviews, interviews,
    salaries: salaryGroups.map((row) => ({ role: row._id.role, location: row._id.location,
      contributors: row.count, currency: "INR", averageBase: Math.round(row.averageBase / 10000) * 10000,
      averageBonus: Math.round(row.averageBonus / 10000) * 10000,
      averageStock: Math.round(row.averageStock / 10000) * 10000 })),
  }, "Company fetched"));
});

export { directory, detail };
