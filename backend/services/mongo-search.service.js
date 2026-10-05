// Keep the fallback response compatible with the OpenSearch adapter.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mongoSearch = async ({ PostModel, JobModel }, { q, kind, tag, company, from, size, autocomplete }) => {
  const regex = q ? new RegExp(`${autocomplete ? "^" : ""}${escapeRegex(q)}`, "i") : null;
  const collect = async (Model, filter, fields, map) => {
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1, _id: -1 }).limit(from + size).select(fields).lean(),
      Model.countDocuments(filter),
    ]);
    return { items: items.map(map), total };
  };
  const tasks = [];
  if (kind !== "job" && !company) {
    const filter = { status: "published" };
    if (kind) filter.type = kind;
    if (tag) filter.tags = tag;
    if (regex) filter.$or = (autocomplete ? ["title"] : ["title", "contentText", "tags"]).map((field) => ({ [field]: regex }));
    tasks.push(collect(PostModel, filter, "type title contentText slug tags publishedAt createdAt", (post) => ({
      kind: post.type, id: String(post._id), title: post.title, description: post.contentText,
      slug: post.slug, tags: post.tags || [], createdAt: post.createdAt,
    })));
  }
  if ((!kind || kind === "job") && !tag) {
    const filter = { status: "published" };
    if (company) filter.company = new RegExp(escapeRegex(company), "i");
    if (regex) filter.$or = (autocomplete ? ["title"] : ["title", "description", "company", "location"]).map((field) => ({ [field]: regex }));
    tasks.push(collect(JobModel, filter, "title description company location sourceUrl createdAt", (job) => ({
      kind: "job", id: String(job._id), title: job.title, description: job.description || "",
      company: job.company, location: job.location, createdAt: job.createdAt, tags: [],
    })));
  }
  const groups = await Promise.all(tasks);
  const items = groups.flatMap((group) => group.items).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt) || b.id.localeCompare(a.id)).slice(from, from + size);
  return { hits: { hits: items.map((item) => ({ _source: item, _score: null })),
    total: { value: groups.reduce((sum, group) => sum + group.total, 0) } } };
};

export { escapeRegex, mongoSearch };
