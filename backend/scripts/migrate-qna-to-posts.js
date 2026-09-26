import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import QnA from "../schemas/qna.schema.js";
import Post from "../schemas/post.schema.js";
import { ensureTopics, refreshTopicPostCounts } from "../services/topic.service.js";

const slugify = (value) => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const mapStatus = (status) => {
  if (status === "approved") return "published";
  if (status === "rejected") return "hidden";
  return "draft";
};

const main = async () => {
  try {
    await connectDB();

    const legacyQuestions = await QnA.find({}).lean();
    let migrated = 0;
    let skipped = 0;

    for (const question of legacyQuestions) {
      const exists = await Post.exists({ _id: question._id });
      if (exists) {
        skipped += 1;
        continue;
      }

      const title = String(question.questionTitle || "").trim();
      if (!title) {
        console.warn(`Skipping legacy question without title: ${question._id}`);
        skipped += 1;
        continue;
      }

      const tags = [...new Set((question.tags || [])
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean))].slice(0, 10);

      const slugBase = slugify(title) || "question";
      const slug = `${slugBase}-${String(question._id).slice(-6)}`;
      const status = mapStatus(question.status);

      await Post.create({
        _id: question._id,
        type: "question",
        title,
        slug,
        content: title,
        contentText: title,
        excerpt: title.slice(0, 240),
        author: question.author,
        tags,
        status,
        views: question.views || 0,
        score: (question.upvotes || 0) - (question.downvotes || 0),
        readingTime: 1,
        publishedAt: status === "published" ? (question.updatedAt || question.createdAt || new Date()) : undefined,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      });

      await ensureTopics(tags);
      migrated += 1;
    }

    const allTags = await Post.distinct("tags", { status: "published" });
    await refreshTopicPostCounts(allTags);

    console.log(`Legacy QnA migration complete. Migrated: ${migrated}, skipped: ${skipped}`);
    console.log("Legacy QnA records were intentionally left in place for rollback safety.");
    await mongoose.disconnect();
  } catch (error) {
    console.error(`Legacy QnA migration failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

main();
