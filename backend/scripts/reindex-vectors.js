import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import Post from "../schemas/post.schema.js";
import { configured, createVectorIndex, removeVectorIndex, indexVectorPost } from "../services/vector-search.service.js";

if (!configured()) throw new Error("Set OPENSEARCH_URL and OPENAI_API_KEY before reindexing vectors");
try {
  await connectDB();
  try { await removeVectorIndex(); } catch (error) { if (!error.message.includes("(404)")) throw error; }
  await createVectorIndex();
  let posts = 0;
  for await (const post of Post.find({ status: "published" }).cursor()) { await indexVectorPost(post); posts += 1; }
  console.log(JSON.stringify({ posts }));
} catch (error) { console.error("Vector reindex failed:", error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
