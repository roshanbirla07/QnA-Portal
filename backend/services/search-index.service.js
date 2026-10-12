import logger from "../utils/logger.js";

const index = "qna_public_v1";
const endpoint = () => {
  const raw = process.env.OPENSEARCH_URL;
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("OPENSEARCH_URL must use HTTPS outside localhost");
  }
  return url.toString().replace(/\/$/, "");
};
const configured = () => Boolean(process.env.OPENSEARCH_URL);
const request = async (method, path, body) => {
  const root = endpoint();
  if (!root) throw new Error("OpenSearch is not configured");
  const username = process.env.OPENSEARCH_USERNAME;
  const password = process.env.OPENSEARCH_PASSWORD;
  const headers = { "content-type": "application/json" };
  if (username || password) {
    if (!username || !password) throw new Error("Set both OpenSearch credentials");
    headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }
  const response = await fetch(`${root}/${path}`, { method, headers,
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`OpenSearch ${method} failed (${response.status})`);
  return response.json().catch(() => ({}));
};

const mapping = { mappings: { properties: {
  kind: { type: "keyword" }, id: { type: "keyword" }, title: { type: "text", fields: { keyword: { type: "keyword" } } },
  description: { type: "text" }, tags: { type: "keyword" }, company: { type: "keyword" },
  location: { type: "keyword" }, slug: { type: "keyword" }, createdAt: { type: "date" },
} } };
const createIndex = () => request("PUT", index, mapping);
const removeIndex = () => request("DELETE", index);
const indexPost = (post) => request("PUT", `${index}/_doc/post-${post._id}`, {
  kind: post.type, id: String(post._id), title: post.title, description: post.contentText,
  slug: post.slug, tags: post.tags || [], createdAt: post.publishedAt || post.createdAt,
});
const indexJob = (job) => request("PUT", `${index}/_doc/job-${job._id}`, {
  kind: "job", id: String(job._id), title: job.title, description: job.description || "",
  company: job.company, location: job.location || "", tags: job.topics || [],
  createdAt: job.postedAt || job.createdAt,
});
const deleteDocument = (kind, id) => request("DELETE", `${index}/_doc/${kind}-${id}`);
const syncPublicPost = async (post, oldKind = post.type) => {
  if (!configured()) return;
  try {
    if (post.status === "published") {
      if (oldKind !== post.type) await deleteDocument(oldKind, post._id);
      await indexPost(post);
    } else await deleteDocument(oldKind, post._id);
  } catch (error) { logger.warn("Search index sync failed", { error: error.message, postId: String(post._id) }); }
};
const syncPublicJob = async (job) => {
  if (!configured()) return;
  try { if (job.status === "published") await indexJob(job);
    else await deleteDocument("job", job._id); }
  catch (error) { logger.warn("Search index sync failed", { error: error.message, jobId: String(job._id) }); }
};

const search = ({ q, kind, tag, company, from, size, autocomplete }) => {
  const filters = [];
  if (kind) filters.push({ term: { kind } });
  if (tag) filters.push({ term: { tags: tag } });
  if (company) filters.push({ term: { company } });
  const query = q ? (autocomplete ? { match_phrase_prefix: { title: q } } :
    { multi_match: { query: q, fields: ["title^3", "description", "company^2", "location"], type: "best_fields" } }) : { match_all: {} };
  return request("POST", `${index}/_search`, { from, size, track_total_hits: true,
    query: { bool: { must: [query], filter: filters } },
    sort: q ? [{ _score: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }] });
};

export { request, configured, createIndex, removeIndex, indexPost, indexJob, syncPublicPost, syncPublicJob, search };
