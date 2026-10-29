import test from "node:test";
import assert from "node:assert/strict";
import { syncLeetCode } from "../services/leetcode-profile.service.js";
import { syncMedium } from "../services/medium-profile.service.js";

test("LeetCode sync maps public solved and contest stats", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_url, options) => {
    if (options.body.includes("QnaContestHistory")) return { ok: true, json: async () => ({ data: { userContestRankingHistory: [
      { attended: true, rating: 1700, contest: { title: "Later", startTime: 2000 } },
      { attended: false, rating: 1500, contest: { startTime: 500 } },
      { attended: true, rating: 1600, contest: { title: "First", startTime: 1000 } },
      { attended: true, rating: null, contest: { startTime: 3000 } },
    ] } }) };
    assert.match(options.body, /matchedUser/);
    return { ok: true, json: async () => ({
      data: {
        matchedUser: {
          username: "coder",
          profile: { ranking: 110, reputation: 2 },
          submitStats: { acSubmissionNum: [
            { difficulty: "All", count: 123 },
            { difficulty: "Easy", count: 55 },
            { difficulty: "Medium", count: 60 },
            { difficulty: "Hard", count: 8 },
          ] },
        },
        userContestRanking: { rating: 1899.3, globalRanking: 1234, attendedContestsCount: 20, topPercentage: 5 },
      },
    }) };
  };
  const result = await syncLeetCode("coder");
  assert.equal(result.metrics.solvedTotal, 123);
  assert.equal(result.metrics.solvedHard, 8);
  assert.equal(result.metrics.contestRating, 1899.3);
  assert.deepEqual(result.metrics.ratingHistory.map((item) => item.rating), [1600, 1700]);
  assert.equal(result.metrics.ratingHistory[0].date, "1970-01-01T00:16:40.000Z");
  assert.deepEqual(result.skills, []);
});

test("Medium sync extracts recent article metadata, not post content", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => `<?xml version="1.0"?><rss version="2.0"><channel><title>Blog</title>
      <item><title><![CDATA[Understanding Kafka &amp; Redis]]></title>
      <link>https://medium.com/@coder/kafka-123</link>
      <pubDate>Mon, 12 Oct 2026 12:00:00 GMT</pubDate>
      <category><![CDATA[Kafka]]></category><content:encoded>private-content</content:encoded></item>
      </channel></rss>`,
  });
  const result = await syncMedium("coder");
  assert.equal(result.metrics.recentArticlesCount, 1);
  assert.equal(result.metrics.recentArticles[0].title, "Understanding Kafka & Redis");
  assert.equal(result.skills[0], "kafka");
  assert.equal(result.metrics.recentArticles[0].publishedAt, "Mon, 12 Oct 2026 12:00:00 GMT");
  assert.deepEqual(result.metrics.recentArticles[0].categories, ["Kafka"]);
  assert.ok(!JSON.stringify(result).includes("private-content"));
});

test("LeetCode history failure does not discard core profile statistics", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let empty = false;
  globalThis.fetch = async (_url, options) => {
    if (options.body.includes("QnaContestHistory")) {
      if (!empty) throw new Error("history unavailable");
      return { ok: true, json: async () => ({ data: { userContestRankingHistory: [] } }) };
    }
    return { ok: true, json: async () => ({ data: { matchedUser: { profile: { ranking: 12 } } } }) };
  };
  assert.equal((await syncLeetCode("coder")).metrics.ratingHistory, null);
  empty = true;
  const result = await syncLeetCode("coder");
  assert.deepEqual(result.metrics.ratingHistory, []);
  assert.equal(result.metrics.profileRanking, 12);
});
