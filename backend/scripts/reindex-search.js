import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import Post from "../schemas/post.schema.js";
import Job from "../schemas/job.schema.js";
import { configured, createIndex, removeIndex, indexPost, indexJob } from "../services/search-index.service.js";

if (!configured()) throw new Error("Set OPENSEARCH_URL and credentials before reindexing");
try {
  await connectDB();
  // Rebuild from public records; never index drafts or private profiles.
  try { await removeIndex(); } catch (error) { if (!error.message.includes("(404)")) throw error; }
  await createIndex();
  let posts = 0;
  let jobs = 0;
  for await (const post of Post.find({ status: "published" }).cursor()) { await indexPost(post); posts += 1; }
  for await (const job of Job.find({ status: "published" }).cursor()) { await indexJob(job); jobs += 1; }
  console.log(JSON.stringify({ posts, jobs }));
} catch (error) {
  console.error("Search reindex failed:", error.message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
