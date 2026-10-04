import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { configured, search } from "../services/search-index.service.js";

const list = asyncHandler(async (req, res) => {
  if (!configured()) throw new ApiError(503, "Search is not configured yet");
  const q = String(req.query.q || "").trim().slice(0, 120);
  const kind = String(req.query.kind || "");
  const tag = String(req.query.tag || "").trim().toLowerCase().slice(0, 60);
  const company = String(req.query.company || "").trim().slice(0, 160);
  if (kind && !["question", "article", "job"].includes(kind)) throw new ApiError(400, "Invalid content type");
  if (tag && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) throw new ApiError(400, "Invalid topic tag");
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  const autocomplete = req.query.autocomplete === "true";
  const size = autocomplete ? 8 : 20;
  const result = await search({ q, kind, tag, company, from: autocomplete ? 0 : (page - 1) * size, size, autocomplete });
  return res.status(200).json(new ApiResponse(200, {
    items: (result.hits?.hits || []).map((hit) => ({ ...hit._source, score: hit._score })),
    total: result.hits?.total?.value || 0, page, hasMore: !autocomplete && page * size < (result.hits?.total?.value || 0),
  }, "Search results fetched"));
});

export { list };
