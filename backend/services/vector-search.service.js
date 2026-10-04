import logger from "../utils/logger.js";
import { request as searchRequest, configured as searchConfigured } from "./search-index.service.js";

const index = "qna_vectors_v1";
const dimensions = 256;
const configured = () => searchConfigured() && Boolean(process.env.OPENAI_API_KEY);
const embed = async (input) => {
  if (!configured()) throw new Error("Vector search is not configured");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST", signal: AbortSignal.timeout(10000),
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", dimensions, input: String(input).slice(0, 6000) }),
  });
  if (!response.ok) throw new Error(`Embedding request failed (${response.status})`);
  const payload = await response.json();
  const vector = payload.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== dimensions || vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid embedding response");
  }
  return vector;
};

const createVectorIndex = () => searchRequest("PUT", index, {
  settings: { index: { knn: true } }, mappings: { properties: {
    embedding: { type: "knn_vector", dimension: dimensions,
      method: { name: "hnsw", engine: "lucene", space_type: "cosinesimil" } },
    postId: { type: "keyword" }, type: { type: "keyword" }, title: { type: "text" },
    slug: { type: "keyword" }, excerpt: { type: "text" }, tags: { type: "keyword" },
  } },
});
const removeVectorIndex = () => searchRequest("DELETE", index);
const indexVectorPost = async (post) => {
  const embedding = await embed(`${post.title}\n${post.excerpt || post.contentText}`);
  return searchRequest("PUT", `${index}/_doc/${post._id}`, { postId: String(post._id),
    type: post.type, title: post.title, slug: post.slug, excerpt: post.excerpt || "", tags: post.tags, embedding });
};
const syncVectorPost = async (post) => {
  if (!configured()) return;
  try {
    if (post.status === "published") await indexVectorPost(post);
    else await searchRequest("DELETE", `${index}/_doc/${post._id}`);
  } catch (error) { logger.warn("Vector index sync failed", { error: error.message, postId: String(post._id) }); }
};
const semanticSearch = async ({ text, k = 10, excludeId }) => {
  const vector = await embed(text);
  const payload = await searchRequest("POST", `${index}/_search`, { size: k + (excludeId ? 1 : 0),
    _source: { excludes: ["embedding"] }, query: { knn: { embedding: { vector, k: k + (excludeId ? 1 : 0) } } } });
  return (payload.hits?.hits || []).filter((hit) => hit._source.postId !== String(excludeId || ""))
    .slice(0, k).map((hit) => ({ ...hit._source, score: hit._score }));
};

export { configured, createVectorIndex, removeVectorIndex, indexVectorPost, syncVectorPost, semanticSearch };
