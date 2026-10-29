import test from "node:test";
import assert from "node:assert/strict";
import { parseGithubCalendar } from "../services/github-calendar.service.js";
import { syncGithub, syncCodeforces } from "../services/external-profile.service.js";

const calendar = '<td id="day2" data-date="2026-10-21" data-level="2"></td><tool-tip for="day2">3 contributions on October 21st.</tool-tip><td id="day1" data-date="2026-10-20" data-level="0"></td><tool-tip for="day1">No contributions on October 20th.</tool-tip>';
test("calendar maps exact dates, counts and source intensity without simulating missing days", () => {
  const result = parseGithubCalendar(calendar, "https://github.com/users/coder/contributions");
  assert.equal(result.total, 3);
  assert.deepEqual(result.days, [{ date: "2026-10-20", count: 0, level: 0 }, { date: "2026-10-21", count: 3, level: 2 }]);
  assert.throws(() => parseGithubCalendar("<html>rate limited</html>", ""), /unavailable/);
  assert.throws(() => parseGithubCalendar(calendar.replace("3 contributions", "many contributions"), ""), /format changed/);
  assert.throws(() => parseGithubCalendar(calendar + calendar, ""), /format changed/);
});

test("GitHub uses unauthenticated public calendar, excludes private repositories, and tolerates calendar failure", async (t) => {
  const original = globalThis.fetch;
  const token = process.env.GITHUB_TOKEN;
  t.after(() => { globalThis.fetch = original; if (token === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = token; });
  process.env.GITHUB_TOKEN = "fixture-token";
  let blocked = false;
  globalThis.fetch = async (url, options) => {
    if (url.includes("/contributions")) {
      assert.equal(options.headers.authorization, undefined);
      return { ok: !blocked, status: blocked ? 429 : 200, text: async () => calendar };
    }
    return { ok: true, json: async () => url.includes("/repos?") ? [
      { name: "public", html_url: "https://github.com/coder/public", language: "JavaScript", stargazers_count: 4 },
      { name: "secret", private: true, language: "Secret", stargazers_count: 99 },
    ] : { public_repos: 1, followers: 2 } };
  };
  const first = await syncGithub("coder");
  assert.equal(first.metrics.contributionCalendar.total, 3);
  assert.equal(first.metrics.totalStars, 4);
  assert.equal(first.metrics.recentRepositories.length, 1);
  blocked = true;
  const partial = await syncGithub("coder");
  assert.equal(partial.metrics.contributionCalendar, null);
  assert.equal(partial.metrics.calendarStatus, "unavailable");
  assert.equal(partial.metrics.publicRepos, 1);
});

test("Codeforces exposes a labeled recent sample and rejects a failed activity response", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let fail = false;
  globalThis.fetch = async (url) => ({ ok: true, json: async () => url.includes("user.info") ? { status: "OK", result: [{ rating: 1374, maxRating: 1400, rank: "pupil" }] } :
    fail ? { status: "FAILED" } : { status: "OK", result: [{ id: 1, contestId: 2, verdict: "OK", creationTimeSeconds: 1000, programmingLanguage: "C++", problem: { contestId: 2, index: "A", name: "Problem A", tags: ["dp"] } }] } });
  const result = await syncCodeforces("coder");
  assert.equal(result.metrics.recentSubmissionCount, 1);
  assert.equal(result.metrics.solvedInRecentSubmissions, 1);
  assert.equal(result.metrics.recentActivity[0].problem, "Problem A");
  fail = true;
  await assert.rejects(syncCodeforces("coder"), /activity sync failed/);
});

test("failed platform sync preserves its last successful metrics and timestamp", async (t) => {
  const { syncExternalProfile } = await import("../services/external-profile.service.js");
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  const profile = { platform: "github", handle: "coder", metrics: { publicRepos: 7 }, lastSyncedAt: "2026-10-20T00:00:00Z", save: async () => {} };
  await assert.rejects(syncExternalProfile(profile), /network unavailable/);
  assert.equal(profile.metrics.publicRepos, 7);
  assert.equal(profile.lastSyncedAt, "2026-10-20T00:00:00Z");
  assert.equal(profile.verificationStatus, "failed");
});

test("Codeforces imports rating history and tolerates optional history failure", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let mode = "success";
  globalThis.fetch = async (url) => {
    if (url.includes("user.rating")) {
      if (mode === "fail") throw new Error("timeout");
      return { ok: true, json: async () => ({ status: "OK", result: mode === "empty" ? [] : [
        { newRating: 1299, ratingUpdateTimeSeconds: 2000, contestName: "Round B" },
        { newRating: 1200, ratingUpdateTimeSeconds: 1000, contestName: "Round A" },
        { newRating: null, ratingUpdateTimeSeconds: 3000 },
      ] }) };
    }
    return { ok: true, json: async () => ({ status: "OK", result: url.includes("user.info") ? [{ rating: 1299 }] : [] }) };
  };
  assert.deepEqual((await syncCodeforces("coder")).metrics.ratingHistory.map((item) => item.rating), [1200, 1299]);
  mode = "empty";
  assert.deepEqual((await syncCodeforces("coder")).metrics.ratingHistory, []);
  mode = "fail";
  const result = await syncCodeforces("coder");
  assert.equal(result.metrics.ratingHistory, null);
  assert.equal(result.metrics.rating, 1299);
});
