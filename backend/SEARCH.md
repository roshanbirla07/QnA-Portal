# OpenSearch setup

Set `OPENSEARCH_URL` to an HTTPS endpoint. If the cluster uses basic authentication, set both `OPENSEARCH_USERNAME` and `OPENSEARCH_PASSWORD` in the backend process environment. The service accepts plain HTTP only for localhost development. Do not place credentials in a URL or commit them.

Run `npm run search:reindex` from `backend/` after configuration. This command **deletes and recreates** the `qna_public_v1` index, then indexes only published posts and jobs. Schedule it during an acceptable search maintenance window. It is also the repair path if asynchronous writes were missed while the cluster was unavailable.

The public endpoint is `GET /api/v1/search?q=...&kind=question|article|job&tag=...&company=...&page=1`. Add `autocomplete=true` for up to eight title suggestions. Search returns HTTP 503 until OpenSearch is configured. Writes to MongoDB stay available if OpenSearch is down; index updates log failures for later reindexing.
