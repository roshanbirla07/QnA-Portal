import User from "../schemas/user.schema.js";
import Job from "../schemas/job.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import Topic from "../schemas/topic.schema.js";

const words = (value) => [...new Set(String(value || "").toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
  .filter((word) => !["and", "the", "for", "with", "developer", "engineer", "software", "work", "experience", "remote"].includes(word));
const includesTerm = (text, term) => text.includes(term);

const matchJobs = async (userId) => {
  const user = await User.findById(userId).select("headline bio location");
  const reputations = await TopicReputation.find({ userId, reputation: { $gt: 0 } })
    .sort({ reputation: -1 }).limit(5).select("topicId reputation");
  const topics = await Topic.find({ _id: { $in: reputations.map((item) => item.topicId) } }).select("name");
  const expertise = topics.map((topic) => topic.name.toLowerCase());
  const headlineTerms = words(user?.headline).slice(0, 12);
  const bioTerms = words(user?.bio).slice(0, 12);
  const location = String(user?.location || "").trim().toLowerCase();
  const hasSignals = Boolean(headlineTerms.length || bioTerms.length || expertise.length || location);
  if (!hasSignals) return { items: [], needsProfile: true };
  const jobs = await Job.find({ status: "published" }).sort({ createdAt: -1 }).limit(300)
    .select("title company location description sourceUrl createdAt verificationStatus");
  const items = jobs.map((job) => {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const signals = [];
    const foundHeadline = headlineTerms.filter((term) => includesTerm(text, term)).slice(0, 3);
    if (foundHeadline.length) signals.push({ label: `Profile headline: ${foundHeadline.join(", ")}`, weight: foundHeadline.length * 3 });
    const foundBio = bioTerms.filter((term) => includesTerm(text, term) && !foundHeadline.includes(term)).slice(0, 3);
    if (foundBio.length) signals.push({ label: `Profile bio: ${foundBio.join(", ")}`, weight: foundBio.length });
    const foundExpertise = expertise.filter((term) => includesTerm(text, term)).slice(0, 3);
    if (foundExpertise.length) signals.push({ label: `Topic expertise: ${foundExpertise.join(", ")}`, weight: foundExpertise.length * 4 });
    if (location && job.location && (job.location.toLowerCase().includes(location) || location.includes(job.location.toLowerCase()))) {
      signals.push({ label: `Location: ${job.location}`, weight: 3 });
    }
    return { job, signals, score: signals.reduce((sum, signal) => sum + signal.weight, 0) };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.job.createdAt) - new Date(a.job.createdAt)).slice(0, 20);
  return { items, needsProfile: false };
};
export { matchJobs };
