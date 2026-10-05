import test from "node:test";
import assert from "node:assert/strict";
import { mongoSearch, escapeRegex } from "../services/mongo-search.service.js";

const model = (items, total = items.length) => {
  const filters = [];
  return { filters, find(filter) {
    filters.push(filter);
    return { sort() { return this; }, limit(n) { this.n = n; return this; }, select() { return this; },
      async lean() { return items.slice(0, this.n); } };
  }, async countDocuments(filter) { filters.push(filter); return total; } };
};
const options = { q: "", kind: "", tag: "", company: "", from: 0, size: 2, autocomplete: false };
test("unconfigured search combines public posts and jobs with stable pagination", async () => {
  const posts = model([{ _id: "a", type: "question", title: "One", createdAt: "2026-01-02" }, { _id: "b", type: "article", title: "Two", createdAt: "2026-01-01" }]);
  const jobs = model([{ _id: "c", title: "Three", createdAt: "2026-01-03" }]);
  const result = await mongoSearch({ PostModel: posts, JobModel: jobs }, { ...options, from: 1 });
  assert.deepEqual(result.hits.hits.map((hit) => hit._source.id), ["a", "b"]);
  assert.equal(result.hits.total.value, 3);
  assert.ok([...posts.filters, ...jobs.filters].every((filter) => filter.status === "published"));
});
test("metacharacters are literal and autocomplete matches only title prefixes", async () => {
  const posts = model([]), jobs = model([]);
  await mongoSearch({ PostModel: posts, JobModel: jobs }, { ...options, q: "node.js (", kind: "question", autocomplete: true });
  assert.equal(posts.filters[0].$or.length, 1);
  assert.ok(posts.filters[0].$or[0].title.test("Node.js (streams)"));
  assert.equal(posts.filters[0].$or[0].title.test("nodeXjs (streams)"), false);
  assert.equal(jobs.filters.length, 0);
  assert.equal(new RegExp(escapeRegex(".*")).test("anything"), false);
});
test("company and tag filters apply only to compatible content", async () => {
  const posts = model([]), jobs = model([]);
  await mongoSearch({ PostModel: posts, JobModel: jobs }, { ...options, company: "Acme" });
  assert.equal(posts.filters.length, 0);
  assert.ok(jobs.filters[0].company.test("ACME"));
  posts.filters.length = 0; jobs.filters.length = 0;
  await mongoSearch({ PostModel: posts, JobModel: jobs }, { ...options, tag: "nodejs" });
  assert.equal(posts.filters[0].tags, "nodejs");
  assert.equal(jobs.filters.length, 0);
});
