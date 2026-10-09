const required = ["OPENAI_API_KEY", "QNA_MCP_URL", "QNA_MCP_API_KEY"];
for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const model = process.env.QNA_JOB_AGENT_MODEL || "gpt-6-luna";
const maxJobs = Math.min(Math.max(Number.parseInt(process.env.QNA_JOB_AGENT_MAX_JOBS || "20", 10) || 20, 1), 50);
const lookbackDays = Math.min(Math.max(Number.parseInt(process.env.QNA_JOB_AGENT_LOOKBACK_DAYS || "7", 10) || 7, 1), 30);
const region = String(process.env.QNA_JOB_AGENT_REGION || "India").trim();
const mcpUrl = process.env.QNA_MCP_URL.replace(/\/$/, "");

const prompt = `
You are the scheduled job discovery agent for QnA Portal, a developer knowledge and career platform.

Goal:
- Find up to ${maxJobs} high-quality, currently active software engineering jobs in ${region}.
- Prefer roles posted within the last ${lookbackDays} days.
- Prioritize official company career pages and trustworthy public job sources.
- Focus on developer roles: backend, frontend, full stack, platform, infrastructure, data engineering, mobile, SRE/DevOps, and early-career software engineering.
- Skip internships unless the title clearly says internship and the source is active.
- Skip staffing spam, duplicate URLs, obviously senior-only executive roles, and jobs with no credible source page.

Use the QnA Portal MCP tools as the source of truth for writes:
1. Call list_topics first so you understand canonical platform topics.
2. Before publishing a candidate, call search_jobs to check for duplicates.
3. Call preview_job for the source URL when possible.
4. Classify the job into 1-5 relevant canonical topics.
5. Call publish_job only when the source still appears active.
6. Never invent compensation, dates, company names, or requirements.
7. Never reopen a job already marked closed unless the source explicitly shows the same URL is active again; if uncertain, leave it closed.
8. For jobs already on QnA Portal that you directly verify are no longer accepting applications, call mark_job_closed.
9. Keep descriptions factual and concise. Preserve the source URL.

At the end, return a short run summary with counts for discovered, published/updated, skipped duplicates, and closed jobs.
`.trim();

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model,
    input: prompt,
    tools: [
      { type: "web_search" },
      {
        type: "mcp",
        server_label: "qna_portal",
        server_url: mcpUrl,
        headers: {
          Authorization: `Bearer ${process.env.QNA_MCP_API_KEY}`,
        },
        allowed_tools: [
          "list_topics",
          "preview_job",
          "search_jobs",
          "publish_job",
          "mark_job_closed",
        ],
        require_approval: "never",
      },
    ],
  }),
  signal: AbortSignal.timeout(15 * 60 * 1000),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`OpenAI Responses API failed (${response.status}): ${body.slice(0, 2000)}`);
  process.exit(1);
}

const result = await response.json();
const outputText = result.output_text ||
  result.output?.flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n") ||
  "Job discovery run completed.";

console.log(outputText);
