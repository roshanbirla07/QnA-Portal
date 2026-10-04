# Semantic search setup

Set `OPENSEARCH_URL` and `OPENAI_API_KEY` in the backend process environment. The API sends **published post titles and excerpts** to the embedding provider; no drafts or private profiles are indexed. The vector index uses 256-dimensional `text-embedding-3-small` embeddings and OpenSearch's k-NN plugin.

After OpenSearch search setup, run `npm run vectors:reindex` from `backend/`. This deletes and recreates only the `qna_vectors_v1` index and can incur embedding API usage. Schedule a maintenance window and monitor usage. It repairs any missed asynchronous writes. Endpoints return HTTP 503 until both services are configured.

Use `POST /api/v1/vector-search` with `{ "text": "..." }` or `GET /api/v1/vector-search/related/:id` for a published post. Search suggestions are advisory; the source post remains the authority.
