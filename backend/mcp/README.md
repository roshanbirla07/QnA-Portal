# QnA Portal MCP

This MCP endpoint lets an AI agent keep QnA Portal job data fresh without giving the model unrestricted database access.

## Endpoint

`POST /mcp`

Use the MCP Streamable HTTP protocol with:

`Authorization: Bearer <mcpApiKey>`

The backend config must provide:

```js
export const mcpApiKey = "replace-with-a-long-random-secret";
export const mcpServiceUserId = "mongodb-user-object-id-for-the-service-account";
```

Use a dedicated service user for `mcpServiceUserId`. Do not use an admin user's personal account.

## Tools

- `list_topics` — discover canonical platform topics.
- `preview_job` — safely read metadata from a public HTTPS job page.
- `search_jobs` — check what already exists, including topic filtering.
- `publish_job` — create or refresh a verified job and attach up to 10 topics.
- `mark_job_closed` — close stale listings without deleting history.

## Recommended AI workflow

1. Search the public web or approved job sources for recent openings.
2. Call `search_jobs` before writing to avoid duplicate work.
3. Call `preview_job` and compare the returned metadata with the source.
4. Call `list_topics` and classify the job into a small set of canonical topics such as `nodejs`, `postgresql`, `kafka`, or `backend`.
5. Call `publish_job` only when the source URL is still active.
6. On later runs, call `mark_job_closed` when an existing source is no longer accepting applications.

The MCP server does not crawl the web itself. The connected AI/client performs discovery, while QnA MCP provides constrained read/write tools for the platform.
