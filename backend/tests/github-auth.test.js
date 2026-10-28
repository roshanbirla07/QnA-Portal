import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import config from "../config/variables.js";
import { resolveGitHubUser } from "../services/github-auth.service.js";
import { exchangeGitHubIdentity } from "../services/github-identity.service.js";
import { getAuthConfig, githubStart, githubComplete, githubLink, githubCancel } from "../controllers/github-auth.controllers.js";
import { loginUser, signupUser } from "../controllers/user.controllers.js";

const identity = { id: "12345", email: "person@example.com", name: "Public name" };
const configure = (t) => {
  const before = { ...config };
  Object.assign(config, { githubClientId: "client-id", githubClientSecret: "server-only-secret", githubRedirectUri: "https://qna.example/auth/github/callback",
    githubRequestTimeoutMs: 10000, jwtSecret: "test-only-secret", corsOrigins: ["https://qna.example"], cookieSecure: true, cookieSameSite: "lax" });
  t.after(() => { Object.keys(config).forEach((key) => delete config[key]); Object.assign(config, before); });
};
const response = () => ({ code: 200, cookies: [], cleared: [], status(code) { this.code = code; return this; }, set() { return this; },
  cookie(name, value, options) { this.cookies.push({ name, value, options }); return this; }, clearCookie(name, options) { this.cleared.push({ name, options }); return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}, cookies = {}) => ({ body, cookies, is: (type) => type === "application/json", get: () => "https://qna.example" });
const start = (returnTo = "/projects?tag=node") => {
  const res = response(); githubStart(request({ returnTo }), res);
  return { res, cookie: res.cookies[0]?.value, state: res.body.data.authorizeUrl && new URL(res.body.data.authorizeUrl).searchParams.get("state") };
};
const stubProvider = (t, change = {}) => t.mock.method(globalThis, "fetch", async (url, options) => {
  let body;
  if (url.includes("access_token")) {
    const input = JSON.parse(options.body);
    assert.equal(input.client_secret, "server-only-secret"); assert.equal(input.redirect_uri, config.githubRedirectUri);
    assert.equal(options.redirect, "error"); assert(options.signal);
    body = { access_token: "never-expose-this-token", token_type: "bearer" };
  } else {
    assert.equal(options.headers.Authorization, "Bearer never-expose-this-token");
    body = url.endsWith("/emails") ? [{ email: identity.email, primary: true, verified: true }] : { id: Number(identity.id), name: identity.name, email: "untrusted@example.com" };
  }
  return { ok: true, json: async () => ({ ...change }[url] || body) };
});
const selectSession = (t) => t.mock.method(User, "findById", () => ({ select: async (fields) => {
  assert.match(fields, /-githubSubject/); assert.match(fields, /-password/); return { _id: "u", roleType: "user" };
} }));

test("start binds random state, PKCE, exact callback and safe destination to a short HttpOnly cookie", (t) => {
  configure(t);
  const { res, cookie, state } = start();
  const flow = jwt.verify(cookie, config.jwtSecret), url = new URL(res.body.data.authorizeUrl);
  assert.equal(res.code, 200); assert.equal(flow.state, state); assert.equal(flow.purpose, "github-flow");
  assert.equal(flow.exp - flow.iat, 600); assert.equal(flow.returnTo, "/projects?tag=node");
  assert.equal(url.searchParams.get("scope"), "user:email"); assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("code_challenge"), createHash("sha256").update(flow.verifier).digest("base64url"));
  assert.equal(res.cookies[0].options.httpOnly, true); assert.equal(res.cookies[0].options.secure, true);
  assert.equal(res.cookies[0].options.path, "/api/v1/user/github");
  assert.equal(jwt.verify(start("//evil.example").cookie, config.jwtSecret).returnTo, "/");
  assert.equal(jwt.verify(start("/\\evil.example").cookie, config.jwtSecret).returnTo, "/");
  assert.notEqual(start().state, state);
  const publicConfig = response(); getAuthConfig({}, publicConfig); assert.deepEqual(publicConfig.body.data, { githubEnabled: true });
});

test("missing config, foreign/absent origins, and non-JSON starts fail closed", (t) => {
  configure(t);
  for (const req of [{ ...request(), get: () => "https://evil.example" }, { ...request(), get: () => undefined }, { ...request(), is: () => false }]) {
    const res = response(); githubStart(req, res); assert.equal(res.code, 403); assert.equal(res.cookies.length, 0);
  }
  config.githubRedirectUri = "https://another.example/auth/github/callback";
  assert.equal(start().res.code, 503);
  delete config.githubClientSecret; const res = response(); getAuthConfig({}, res); assert.deepEqual(res.body.data, { githubEnabled: false });
});

test("state/cookie mismatch, expired or wrong-purpose proofs, and cancellation never exchange codes", async (t) => {
  configure(t); const fetch = t.mock.method(globalThis, "fetch", () => { throw new Error("must not call provider"); });
  const good = start();
  const expired = jwt.sign({ purpose: "github-flow", state: good.state }, config.jwtSecret, { expiresIn: -1 });
  for (const [cookie, body] of [[undefined, { state: good.state }], ["tampered", { state: good.state }], [expired, { state: good.state }],
    [jwt.sign({ purpose: "github-link" }, config.jwtSecret), { state: good.state }], [good.cookie, { state: "wrong" }],
    [good.cookie, { state: good.state, error: "access_denied" }]]) {
    const res = response(); await githubComplete(request({ code: "code", ...body }, { githubSignInFlow: cookie }), res);
    assert.equal(res.code, 401); assert.equal(res.cookies.length, 0); assert(res.cleared.length);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("code exchange revalidates numeric identity and verified primary email, keeps tokens server-only", async (t) => {
  configure(t); const provider = stubProvider(t);
  assert.deepEqual(await exchangeGitHubIdentity("code", "verifier"), identity);
  assert.equal(JSON.parse(provider.mock.calls[0].arguments[1].body).code_verifier, "verifier");
  provider.mock.restore();
  stubProvider(t, { "https://api.github.com/user/emails": [{ email: identity.email, primary: true, verified: false }] });
  await assert.rejects(exchangeGitHubIdentity("code", "verifier"), /Verify your primary email/);
});

test("provider denial, malformed identity and network failures expose no raw provider secrets", async (t) => {
  configure(t);
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ error: "bad_verification_code", error_description: "secret" }) }));
  await assert.rejects(exchangeGitHubIdentity("code", "verifier"), (e) => e.statusCode === 401 && !e.message.includes("secret")); mock.mock.restore();
  const provider = stubProvider(t, { "https://api.github.com/user": { id: "12345" } });
  await assert.rejects(exchangeGitHubIdentity("code", "verifier"), /identity could not be verified/); provider.mock.restore();
  t.mock.method(globalThis, "fetch", async () => { throw new Error("private request data"); });
  await assert.rejects(exchangeGitHubIdentity("code", "verifier"), (e) => e.statusCode === 502 && !e.message.includes("private"));
});

test("new GitHub users have no password, server-owned roles and unpublished profiles", async (t) => {
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => null } : Promise.resolve(null));
  t.mock.method(User, "create", async (data) => {
    assert.deepEqual(data, { email: identity.email, githubSubject: identity.id, roleType: "user", displayName: identity.name });
    const user = new User(data); await user.validate(); assert.equal(user.password, undefined); assert.equal(user.candidateProfileVisible, false); return user;
  });
  assert.equal((await resolveGitHubUser({ identity, roleType: "admin" })).created, true);
});

test("returning users resolve by stable GitHub ID without overwriting roles or email", async (t) => {
  const user = { _id: "u", roleType: "admin", email: "original@example.com" };
  t.mock.method(User, "findOne", async (filter) => { assert.deepEqual(filter, { githubSubject: identity.id }); return user; });
  assert.equal((await resolveGitHubUser({ identity })).user, user); assert.equal(user.email, "original@example.com");
});

test("matching emails need password proof and a conflicting GitHub subject is never replaced", async (t) => {
  const user = { _id: "u", roleType: "admin", isPasswordCorrect: async (password) => password === "correct" };
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => user } : Promise.resolve(null));
  const update = t.mock.method(User, "findOneAndUpdate", async (filter, change) => {
    assert.equal(filter._id, "u"); assert.deepEqual(change, { $set: { githubSubject: identity.id } }); assert.equal(filter.$or[1].githubSubject, identity.id); return user;
  });
  await assert.rejects(resolveGitHubUser({ identity }), (e) => e.code === "GITHUB_LINK_REQUIRED");
  await assert.rejects(resolveGitHubUser({ identity, password: "wrong" }), (e) => e.code === "GITHUB_PASSWORD_INVALID");
  assert.equal(update.mock.callCount(), 0);
  assert.equal((await resolveGitHubUser({ identity, password: "correct" })).user.roleType, "admin");
  user.githubSubject = "other";
  await assert.rejects(resolveGitHubUser({ identity, password: "correct" }), /already connected/); assert.equal(update.mock.callCount(), 1);
});

test("concurrent creation recovers only the same GitHub subject", async (t) => {
  let winner = null;
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => null } : Promise.resolve(winner));
  t.mock.method(User, "create", async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); });
  await assert.rejects(resolveGitHubUser({ identity }), (e) => e.code === "GITHUB_LINK_REQUIRED");
  t.mock.method(User, "create", async () => { winner = { _id: "u" }; throw Object.assign(new Error("duplicate"), { code: 11000 }); });
  assert.equal((await resolveGitHubUser({ identity })).user, winner);
});

test("complete issues the canonical session and ignores browser-supplied identity/roles", async (t) => {
  configure(t); stubProvider(t); selectSession(t);
  t.mock.method(User, "findOne", async (filter) => { assert.deepEqual(filter, { githubSubject: identity.id }); return { _id: "u", roleType: "user" }; });
  const { cookie, state } = start(); const res = response();
  await githubComplete(request({ code: "code", state, roleType: "admin", identity: { id: "bad" } }, { githubSignInFlow: cookie }), res);
  assert.equal(res.code, 200); assert.equal(res.body.data.returnTo, "/projects?tag=node");
  assert.equal(jwt.verify(res.body.data.token, config.jwtSecret).roleType, "user");
  assert.equal(res.cookies[0].name, "authToken"); assert.equal(res.cookies[0].options.httpOnly, true);
  assert(!JSON.stringify(res.body).includes("never-expose-this-token"));
});

test("link retries use a signed HttpOnly identity proof, not a reused code or client identity", async (t) => {
  configure(t); const fetch = stubProvider(t); selectSession(t);
  const user = { _id: "u", roleType: "user", isPasswordCorrect: async (password) => password === "correct" };
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => user } : Promise.resolve(null));
  t.mock.method(User, "findOneAndUpdate", async () => user);
  const { cookie, state } = start(); const res = response();
  await githubComplete(request({ code: "code", state }, { githubSignInFlow: cookie }), res);
  assert.equal(res.code, 409); assert.equal(res.body.data.code, "GITHUB_LINK_REQUIRED"); assert(!res.body.data.token);
  const link = res.cookies.find((c) => c.name === "githubSignInLink"); assert(link.options.httpOnly);
  const denied = response(); await githubLink(request({ password: "wrong" }, { githubSignInLink: link.value }), denied);
  assert.equal(denied.code, 401); assert(!denied.cleared.some((c) => c.name === "githubSignInLink"));
  const linked = response(); await githubLink(request({ password: "correct", identity: { id: "bad" } }, { githubSignInLink: link.value }), linked);
  assert.equal(linked.code, 200); assert.equal(fetch.mock.callCount(), 3); assert(linked.cleared.some((c) => c.name === "githubSignInLink"));
  const forged = response(); await githubLink(request({ password: "correct" }, { githubSignInLink: "fake" }), forged); assert.equal(forged.code, 401);
  const cancelled = response(); githubCancel(request(), cancelled); assert.equal(cancelled.code, 200); assert.equal(cancelled.cleared.length, 2);
});
test("existing email/password login still works and invalid credentials share one response", async (t) => {
  configure(t);
  const call = (handler, body) => new Promise((resolve, reject) => { const res = response(); res.json = (value) => { res.body = value; resolve(res); return res; }; handler(request(body), res, reject); });
  const existing = { _id: "u", roleType: "user", isPasswordCorrect: async (password) => password === "correct" };
  let found = existing;
  t.mock.method(User, "findOne", async () => found);
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: "u" }) }));
  assert.equal((await call(loginUser, { email: "person@example.com", password: "correct" })).code, 200);
  const wrong = await call(loginUser, { email: "person@example.com", password: "wrong" }); found = null;
  const unknown = await call(loginUser, { email: "unknown@example.com", password: "wrong" });
  assert.equal(wrong.code, 401); assert.equal(unknown.code, 401); assert.equal(wrong.body.message, unknown.body.message);
  assert.equal((await call(signupUser, { email: {}, password: "correct" })).code, 400);
  const githubOnly = new User({ email: identity.email, githubSubject: identity.id });
  assert.equal(await githubOnly.isPasswordCorrect("anything"), false);
  await assert.rejects(new User({ email: "local@example.com" }).validate(), /password/);
});
