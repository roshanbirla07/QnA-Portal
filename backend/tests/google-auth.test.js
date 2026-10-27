import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import config from "../config/variables.js";
import { googleAuthClient, resolveGoogleUser } from "../services/google-auth.service.js";
import { getAuthConfig, googleChallenge, googleSignIn } from "../controllers/google-auth.controllers.js";
import { loginUser, signupUser } from "../controllers/user.controllers.js";

const clientId = "test-client.apps.googleusercontent.com";
const payload = { sub: "google-person", email: "person@gmail.com", email_verified: true, nonce: "nonce", name: "Public name" };
const stubPayload = (t, value = payload) => t.mock.method(googleAuthClient, "verifyIdToken", async (options) => {
  assert.equal(options.audience, clientId);
  assert.equal(options.idToken, "credential");
  return { getPayload: () => value };
});
const resolve = (extra = {}) => resolveGoogleUser({ credential: "credential", nonce: "nonce", clientId, ...extra });
const configure = (t) => {
  const before = { ...config };
  Object.assign(config, { googleClientId: clientId, jwtSecret: "test-only-secret", corsOrigins: ["https://qna.example"], cookieSecure: true, cookieSameSite: "lax" });
  t.after(() => { Object.keys(config).forEach((key) => delete config[key]); Object.assign(config, before); });
};
const response = () => ({ code: 200, cookies: [], cleared: [], status(code) { this.code = code; return this; }, set() { return this; },
  cookie(name, value, options) { this.cookies.push({ name, value, options }); return this; }, clearCookie(name, options) { this.cleared.push({ name, options }); return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}, cookie) => ({ body, cookies: { googleSignInNonce: cookie }, is: (type) => type === "application/json", get: () => "https://qna.example" });

test("new Google accounts use only verified claims, remain unpublished, and never receive a supplied role", async (t) => {
  stubPayload(t);
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => null } : Promise.resolve(null));
  t.mock.method(User, "create", async (data) => {
    assert.deepEqual(data, { email: payload.email, googleSubject: payload.sub, roleType: "user", displayName: "Public name" });
    const document = new User(data);
    await document.validate();
    assert.equal(document.candidateProfileVisible, false);
    assert.equal(document.password, undefined);
    return document;
  });
  assert.equal((await resolve({ roleType: "admin" })).created, true);
});

test("returning users are identified by Google sub without changing email, role, or profile", async (t) => {
  stubPayload(t, { ...payload, email: "changed@gmail.com" });
  const existing = { _id: "u", roleType: "admin", email: "original@gmail.com", candidateProfileVisible: false };
  t.mock.method(User, "findOne", async (filter) => { assert.deepEqual(filter, { googleSubject: payload.sub }); return existing; });
  assert.equal((await resolve()).user, existing);
  assert.equal(existing.email, "original@gmail.com");
});

test("matching emails require password proof and cannot silently merge accounts", async (t) => {
  stubPayload(t);
  const user = { _id: "u", roleType: "admin", isPasswordCorrect: async (password) => password === "correct" };
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => user } : Promise.resolve(null));
  const update = t.mock.method(User, "findOneAndUpdate", async (filter, change) => {
    assert.equal(filter._id, "u");
    assert.deepEqual(change, { $set: { googleSubject: payload.sub } });
    return user;
  });
  await assert.rejects(resolve(), (e) => e.code === "GOOGLE_LINK_REQUIRED");
  await assert.rejects(resolve({ password: "wrong" }), (e) => e.code === "GOOGLE_PASSWORD_INVALID");
  assert.equal(update.mock.callCount(), 0);
  assert.equal((await resolve({ password: "correct" })).user.roleType, "admin");
  assert.equal(update.mock.callCount(), 1);
});

test("a different existing Google identity is never replaced", async (t) => {
  stubPayload(t);
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => ({ googleSubject: "another-sub" }) } : Promise.resolve(null));
  await assert.rejects(resolve({ password: "correct" }), (e) => e.statusCode === 409);
});

test("invalid nonce, missing subject, or unverified email cannot access the database", async (t) => {
  t.mock.method(User, "findOne", () => assert.fail("must not query users"));
  for (const claims of [{ ...payload, nonce: "other" }, { ...payload, email_verified: false }, { ...payload, sub: "" }]) {
    const mock = stubPayload(t, claims);
    await assert.rejects(resolve(), (e) => e.statusCode === 401);
    mock.mock.restore();
  }
});

test("Google library enforces signature, issuer, audience, and expiry before account lookup", async (t) => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  t.mock.method(googleAuthClient, "getFederatedSignonCertsAsync", async () => ({ certs: { fixture: publicKey.export({ type: "spki", format: "pem" }) }, format: "PEM" }));
  t.mock.method(User, "findOne", async () => ({ _id: "u" }));
  const token = (options = {}, key = privateKey) => jwt.sign(payload, key, { algorithm: "RS256", keyid: "fixture", issuer: "https://accounts.google.com", audience: clientId, expiresIn: "1h", ...options });
  assert.equal((await resolve({ credential: token() })).user._id, "u");
  for (const credential of [token({ audience: "other-client" }), token({ issuer: "https://evil.example" }), token({ expiresIn: -3600 }), token({}, generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey)]) {
    await assert.rejects(resolve({ credential }), (e) => e.statusCode === 401);
  }
});

test("concurrent creation recovers only by the same subject", async (t) => {
  stubPayload(t);
  let subjectCalls = 0;
  t.mock.method(User, "findOne", (filter) => filter.email ? { select: async () => null } : Promise.resolve(subjectCalls++ ? { _id: "winner" } : null));
  t.mock.method(User, "create", async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); });
  assert.equal((await resolve()).user._id, "winner");
});

test("challenge is signed, HttpOnly, origin-bound, and config exposes no secret", async (t) => {
  configure(t);
  const res = response();
  googleChallenge(request(), res);
  assert.equal(res.code, 200);
  assert.equal(res.cookies[0].options.httpOnly, true);
  assert.equal(res.cookies[0].options.secure, true);
  assert.equal(res.cookies[0].options.path, "/api/v1/user/google");
  assert.equal(jwt.verify(res.cookies[0].value, config.jwtSecret).nonce, res.body.data.nonce);
  const publicConfig = response(); getAuthConfig({}, publicConfig);
  assert.deepEqual(publicConfig.body.data, { googleClientId: clientId });
  for (const bad of [{ ...request(), get: () => "https://evil.example" }, { ...request(), is: () => false }]) {
    const denied = response(); googleChallenge(bad, denied); assert.equal(denied.code, 403); assert.equal(denied.cookies.length, 0);
  }
  delete config.googleClientId;
  const disabled = response(); googleChallenge(request(), disabled); assert.equal(disabled.code, 503);
});

test("Google endpoint refuses missing/tampered/foreign-purpose cookies and client identity fields", async (t) => {
  configure(t);
  for (const cookie of [undefined, "tampered", jwt.sign({ purpose: "another", nonce: "nonce" }, config.jwtSecret)]) {
    const denied = response(); await googleSignIn(request({ credential: "credential", email: "admin@example.com", roleType: "admin" }, cookie), denied);
    assert.equal(denied.code, 401); assert.equal(denied.cookies.length, 0);
  }
  stubPayload(t);
  t.mock.method(User, "findOne", async () => ({ _id: "u", roleType: "user" }));
  t.mock.method(User, "findById", () => ({ select: async (fields) => { assert.match(fields, /-googleSubject/); assert.match(fields, /-password/); return { _id: "u", roleType: "user" }; } }));
  const validCookie = jwt.sign({ purpose: "google-sign-in", nonce: "nonce" }, config.jwtSecret);
  const res = response(); await googleSignIn(request({ credential: "credential", roleType: "admin" }, validCookie), res);
  assert.equal(res.code, 200);
  assert.equal(jwt.verify(res.body.data.token, config.jwtSecret).roleType, "user");
  assert.equal(res.cookies[0].name, "authToken");
  assert.equal(res.cookies[0].options.httpOnly, true);
  assert.equal(res.cookies[0].options.secure, true);
  assert.equal(res.cleared[0].name, "googleSignInNonce");
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
  const googleOnly = new User({ email: payload.email, googleSubject: payload.sub });
  assert.equal(await googleOnly.isPasswordCorrect("anything"), false);
  await assert.rejects(new User({ email: "local@example.com" }).validate(), /password/);
});
