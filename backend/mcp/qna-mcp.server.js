import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import * as z from "zod/v4";
import mongoose from "mongoose";
import config from "../config/variables.js";
import Job from "../schemas/job.schema.js";
import Topic from "../schemas/topic.schema.js";
import { normalizeJobUrl, previewJob } from "../services/job-preview.service.js";
import { ensureTopics, normalizeTopicSlug } from "../services/topic.service.js";
import { syncPublicJob } from "../services/search-index.service.js";

const MAX_TOOL_LIMIT = 50;

const textResult = (value) => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const normalizeTopics = (topics = []) => [...new Set(
  topics.map(normalizeTopicSlug).filter(Boolean)
)].slice(0, 10);

const requireServiceUserId = () => {
  const id = String(config.mcpServiceUserId || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("MCP service user is not configured");
  }
  return id;
};

const createQnaMcpServer = () => {
  const server = new McpServer({
    name: "qna-portal",
    version: "1.0.0",
  });

  server.registerTool(
    "list_topics",
    {
      description: "List QnA Portal topics so an AI agent can classify new jobs consistently.",
      inputSchema: z.object({
        query: z.string().trim().max(80).optional(),
        limit: z.number().int().min(1).max(100).default(30),
      }),
    },
    async ({ query, limit }) => {
      const filter = query
        ? { $or: [{ name: new RegExp(query, "i") }, { slug: new RegExp(query, "i") }] }
        : {};

      const items = await Topic.find(filter)
        .sort({ followersCount: -1, postCount: -1, name: 1 })
        .limit(limit)
        .select("name slug description followersCount postCount")
        .lean();

      return textResult({ items });
    }
  );

  server.registerTool(
    "preview_job",
    {
      description: "Fetch safe metadata from a public HTTPS job URL before deciding whether to publish it.",
      inputSchema: z.object({
        url: z.string().url(),
      }),
    },
    async ({ url }) => textResult(await previewJob(url))
  );

  server.registerTool(
    "search_jobs",
    {
      description: "Search currently published QnA Portal jobs, optionally by topic, company, location, or text.",
      inputSchema: z.object({
        query: z.string().trim().max(80).optional(),
        topic: z.string().trim().max(80).optional(),
        company: z.string().trim().max(80).optional(),
        location: z.string().trim().max(80).optional(),
        limit: z.number().int().min(1).max(MAX_TOOL_LIMIT).default(20),
      }),
    },
    async ({ query, topic, company, location, limit }) => {
      const filter = { status: "published" };
      if (query) filter.$text = { $search: query };
      if (topic) filter.topics = normalizeTopicSlug(topic);
      if (company) filter.company = { $regex: company.replace(/[^a-z0-9 .&+-]/gi, ""), $options: "i" };
      if (location) filter.location = { $regex: location.replace(/[^a-z0-9 ,.-]/gi, ""), $options: "i" };

      const items = await Job.find(filter)
        .sort({ postedAt: -1, createdAt: -1 })
        .limit(limit)
        .select("title company location description sourceUrl topics postedAt createdAt verificationStatus")
        .lean();

      return textResult({ items });
    }
  );

  server.registerTool(
    "publish_job",
    {
      description: "Create or refresh a job on QnA Portal after the AI agent has verified the source URL and classified its topics. This tool never silently reopens a job already marked closed.",
      inputSchema: z.object({
        sourceUrl: z.string().url(),
        title: z.string().trim().min(1).max(220),
        company: z.string().trim().min(1).max(160),
        location: z.string().trim().max(160).default(""),
        description: z.string().trim().max(1000).default(""),
        topics: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
        postedAt: z.string().datetime().optional(),
      }),
    },
    async ({ sourceUrl, title, company, location, description, topics, postedAt }) => {
      const normalizedUrl = normalizeJobUrl(sourceUrl).toString();
      const normalizedTopics = normalizeTopics(topics);
      await ensureTopics(normalizedTopics);

      const values = {
        title,
        company,
        location,
        description,
        topics: normalizedTopics,
        source: "mcp",
        lastAiUpdatedAt: new Date(),
        ...(postedAt ? { postedAt: new Date(postedAt) } : {}),
      };

      const existing = await Job.findOne({ sourceUrl: normalizedUrl });
      if (existing) {
        existing.set(values);
        await existing.save();
        if (existing.status === "published") void syncPublicJob(existing);

        return textResult({
          action: "updated",
          reopened: false,
          status: existing.status,
          job: existing,
        });
      }

      const job = await Job.create({
        sourceUrl: normalizedUrl,
        ...values,
        submittedBy: requireServiceUserId(),
        discoveredAt: new Date(),
      });
      void syncPublicJob(job);

      return textResult({ action: "created", job });
    }
  );

  server.registerTool(
    "mark_job_closed",
    {
      description: "Mark a job as closed when the source is no longer accepting applications.",
      inputSchema: z.object({
        sourceUrl: z.string().url(),
        note: z.string().trim().max(160).default("Source no longer appears active"),
      }),
    },
    async ({ sourceUrl, note }) => {
      const normalizedUrl = normalizeJobUrl(sourceUrl).toString();
      const job = await Job.findOneAndUpdate(
        { sourceUrl: normalizedUrl },
        {
          $set: {
            status: "closed",
            verificationStatus: "possibly_closed",
            lastCheckedAt: new Date(),
            checkNote: note,
            lastAiUpdatedAt: new Date(),
          },
        },
        { new: true }
      );

      return textResult(job
        ? { action: "closed", job }
        : { action: "not_found", sourceUrl: normalizedUrl });
    }
  );

  return server;
};

const qnaMcpHandler = createMcpHandler(() => createQnaMcpServer(), {
  responseMode: "json",
});

const qnaMcpNodeHandler = toNodeHandler(qnaMcpHandler);

export { createQnaMcpServer, qnaMcpHandler, qnaMcpNodeHandler };
