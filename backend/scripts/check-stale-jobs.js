import mongoose from "mongoose";
import connectDB from "../db/connection.js";
import Job from "../schemas/job.schema.js";
import { previewJob } from "../services/job-preview.service.js";

const checkJobs = async () => {
  const dueBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const jobs = await Job.find({
    status: "published",
    $or: [{ lastCheckedAt: null }, { lastCheckedAt: { $lt: dueBefore } }],
  }).sort({ lastCheckedAt: 1, _id: 1 }).limit(100);

  const summary = { checked: 0, verified: 0, suspect: 0 };
  for (const job of jobs) {
    try {
      const preview = await previewJob(job.sourceUrl);
      if (!preview.title) throw new Error("No job title was found on the source page");
      job.checkFailures = 0;
      job.verificationStatus = "verified";
      job.checkNote = "";
      summary.verified += 1;
    } catch (error) {
      job.checkFailures = (job.checkFailures || 0) + 1;
      // A temporary block or redirect must not close a legitimate listing.
      job.verificationStatus = job.checkFailures >= 2 ? "possibly_closed" : "unverified";
      job.checkNote = String(error.message || "Source page unavailable").slice(0, 160);
      if (job.verificationStatus === "possibly_closed") summary.suspect += 1;
    }
    job.lastCheckedAt = new Date();
    await job.save();
    summary.checked += 1;
  }
  return summary;
};

try {
  await connectDB();
  console.log(JSON.stringify(await checkJobs()));
} catch (error) {
  console.error("Stale job check failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
