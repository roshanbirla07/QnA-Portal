import test from "node:test";
import assert from "node:assert/strict";
import User from "../schemas/user.schema.js";
import ExternalProfile from "../schemas/external-profile.schema.js";
import TopicReputation from "../schemas/topic-reputation.schema.js";
import { updateMyProfile } from "../controllers/profile.controllers.js";
import { getPublicDeveloperProfile, listCandidates, updateMyAccountVisibility, upsertMyAccount } from "../controllers/developer-profile.controllers.js";

const invoke = (handler, req) => new Promise((resolve, reject) => {
  handler(req, { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body }); } }, reject);
});
const query = (value) => ({ select() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, populate() { return this; }, lean: async () => value });

test("profile editor saves normalized identity and actual boolean preferences, excluding secrets", async (t) => {
  t.mock.method(User, "findByIdAndUpdate", (id, update, options) => {
    assert.equal(id, "owner");
    assert.deepEqual(update.$set, { username: "new_user", displayName: "New User", headline: "Engineer", candidateProfileVisible: true });
    assert.equal(options.runValidators, true);
    return { select(fields) { assert.match(fields, /-password -email/); return Promise.resolve(update.$set); } };
  });
  const result = await invoke(updateMyProfile, { user: { id: "owner" }, body: {
    username: " New_User ", displayName: " New User ", headline: " Engineer ", candidateProfileVisible: true, roleType: "admin",
  } });
  assert.equal(result.code, 200);
  assert.equal(result.body.data.username, "new_user");
  await assert.rejects(invoke(updateMyProfile, { user: { id: "owner" }, body: { candidateProfileVisible: "false" } }), /must be a boolean/);
  await assert.rejects(invoke(updateMyProfile, { user: { id: "owner" }, body: { username: "../admin" } }), /Username must/);
});

test("publishing without a username fails clearly; duplicate usernames return 409", async (t) => {
  t.mock.method(User, "findById", () => query({}));
  await assert.rejects(invoke(updateMyProfile, { user: { id: "owner" }, body: { candidateProfileVisible: true } }), /Set a QnA username/);
  t.mock.method(User, "findByIdAndUpdate", () => ({ select: async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); } }));
  await assert.rejects(invoke(updateMyProfile, { user: { id: "owner" }, body: { username: "taken" } }), (error) => error.statusCode === 409);
});

test("unpublished developer profiles never query or return connected accounts", async (t) => {
  t.mock.method(User, "findOne", () => query({ candidateProfileVisible: false }));
  const accounts = t.mock.method(ExternalProfile, "find", () => { throw new Error("must not read accounts"); });
  await assert.rejects(invoke(getPublicDeveloperProfile, { params: { username: "private" } }), (error) => error.statusCode === 404);
  assert.equal(accounts.mock.callCount(), 0);
});

test("public detail and directory query only public accounts and select no email/password", async (t) => {
  const publicUser = { _id: "u", username: "coder", candidateProfileVisible: true };
  t.mock.method(User, "findOne", () => {
    const result = query(publicUser);
    result.select = (fields) => { assert.ok(!/email|password/.test(fields)); return result; };
    return result;
  });
  t.mock.method(User, "find", (filter) => { assert.equal(filter.candidateProfileVisible, true); return query([publicUser]); });
  t.mock.method(User, "countDocuments", async () => 1);
  const visible = { userId: "u", platform: "github", visibility: "public" };
  t.mock.method(ExternalProfile, "find", (filter) => { assert.equal(filter.visibility, "public"); return query([visible]); });
  t.mock.method(TopicReputation, "find", () => query([]));
  const detail = await invoke(getPublicDeveloperProfile, { params: { username: "coder" } });
  const directory = await invoke(listCandidates, { query: {} });
  assert.deepEqual(detail.body.data.accounts, [visible]);
  assert.deepEqual(directory.body.data.items[0].accounts, [visible]);
});

test("visibility-only edits are owner-scoped and never reset metrics", async (t) => {
  t.mock.method(ExternalProfile, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter, { userId: "owner", platform: "github" });
    assert.deepEqual(update, { $set: { visibility: "hidden" } });
    return { platform: "github", visibility: "hidden", metrics: { publicRepos: 8 } };
  });
  const result = await invoke(updateMyAccountVisibility, { user: { id: "owner" }, params: { platform: "github" }, body: { visibility: "hidden" } });
  assert.equal(result.body.data.metrics.publicRepos, 8);
});

test("updating an existing hidden handle preserves its privacy when visibility is omitted", async (t) => {
  t.mock.method(ExternalProfile, "findOne", () => query({ visibility: "hidden" }));
  t.mock.method(ExternalProfile, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.userId, "owner");
    assert.equal(update.$set.visibility, undefined);
    assert.deepEqual(update.$setOnInsert, { visibility: "public" });
    return { ...update.$set, visibility: "hidden" };
  });
  const result = await invoke(upsertMyAccount, { user: { id: "owner" }, params: { platform: "github" }, body: { handle: "coder", sync: false } });
  assert.equal(result.body.data.visibility, "hidden");
});
