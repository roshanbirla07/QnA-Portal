import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/variables.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { exchangeGitHubIdentity, GITHUB_AUTHORIZE_URL } from "../services/github-identity.service.js";
import { resolveGitHubUser } from "../services/github-auth.service.js";
import { respondWithSession } from "./user.controllers.js";

const FLOW_COOKIE = "githubSignInFlow", LINK_COOKIE = "githubSignInLink";
// GitHub authorization codes expire after ten minutes; keep local proofs no longer.
const FLOW_TTL_SECONDS = 10 * 60;
const cookieOptions = () => ({ httpOnly: true, secure: config.cookieSecure, sameSite: config.cookieSameSite, path: "/api/v1/user/github", maxAge: FLOW_TTL_SECONDS * 1000 });
const clear = (res, name) => { const options = cookieOptions(); delete options.maxAge; res.clearCookie(name, options); };
const enabled = () => {
  try {
    const redirect = new URL(config.githubRedirectUri);
    return Boolean(config.githubClientId && config.githubClientSecret && config.jwtSecret &&
      Number.isInteger(config.githubRequestTimeoutMs) && config.githubRequestTimeoutMs > 0 &&
      ["https:", "http:"].includes(redirect.protocol) && !redirect.username && !redirect.password && !redirect.search && !redirect.hash &&
      redirect.pathname === "/auth/github/callback" && config.corsOrigins?.includes(redirect.origin));
  } catch { return false; }
};
const checkRequest = (req) => {
  if (!req.is("application/json") || !config.corsOrigins?.includes(req.get("origin"))) throw new ApiError(403, "This sign-in request is not allowed.");
  if (!enabled()) throw new ApiError(503, "GitHub sign-in is unavailable. Use email and password.");
};
const safeReturn = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !/[\r\n]/.test(value) ? value : "/";
const sign = (claims, purpose) => jwt.sign({ ...claims, purpose }, config.jwtSecret, { algorithm: "HS256", expiresIn: FLOW_TTL_SECONDS });
const proof = (req, name, purpose) => {
  try {
    const claims = jwt.verify(req.cookies?.[name], config.jwtSecret, { algorithms: ["HS256"] });
    if (claims.purpose !== purpose) throw new Error("Wrong purpose");
    return claims;
  } catch { throw new ApiError(401, "Your sign-in session ended. Start GitHub sign-in again."); }
};
const failure = (res, error, preserveLink = false) => {
  clear(res, FLOW_COOKIE);
  if (!preserveLink) clear(res, LINK_COOKIE);
  const status = error instanceof ApiError ? error.statusCode : 500;
  return res.status(status).set("Cache-Control", "no-store").json(new ApiResponse(status,
    { code: preserveLink ? error.code : undefined }, error instanceof ApiError ? error.message : "GitHub sign-in could not finish. Please try again."));
};
export const getAuthConfig = (req, res) => res.set("Cache-Control", "no-store").json(new ApiResponse(200, { githubEnabled: enabled() }));

export const githubStart = (req, res) => {
  try {
    checkRequest(req);
    // The configured frontend receives the callback, so the initiating origin must match it.
    if (new URL(config.githubRedirectUri).origin !== req.get("origin")) throw new ApiError(403, "GitHub sign-in is not configured for this address.");
    const state = randomBytes(32).toString("base64url"), verifier = randomBytes(32).toString("base64url");
    res.cookie(FLOW_COOKIE, sign({ state, verifier, returnTo: safeReturn(req.body?.returnTo) }, "github-flow"), cookieOptions());
    clear(res, LINK_COOKIE);
    const url = new URL(GITHUB_AUTHORIZE_URL);
    url.search = new URLSearchParams({ client_id: config.githubClientId, redirect_uri: config.githubRedirectUri, scope: "user:email",
      state, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
    return res.set("Cache-Control", "no-store").json(new ApiResponse(200, { authorizeUrl: url.toString() }));
  } catch (error) { return failure(res, error); }
};

export const githubComplete = async (req, res) => {
  try {
    checkRequest(req);
    const flow = proof(req, FLOW_COOKIE, "github-flow");
    const state = req.body?.state;
    if (typeof state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(state) || typeof flow.state !== "string" || state.length !== flow.state.length || !timingSafeEqual(Buffer.from(state), Buffer.from(flow.state))) {
      throw new ApiError(401, "GitHub sign-in could not be verified. Start again.");
    }
    if (req.body?.error) throw new ApiError(401, "GitHub sign-in was cancelled. You can try again or use email.");
    if (typeof req.body?.code !== "string" || !req.body.code) throw new ApiError(400, "Start GitHub sign-in again.");
    const identity = await exchangeGitHubIdentity(req.body.code, flow.verifier);
    clear(res, FLOW_COOKIE);
    try {
      const result = await resolveGitHubUser({ identity });
      clear(res, LINK_COOKIE);
      return await respondWithSession(result.user, res, result.created ? 201 : 200, safeReturn(flow.returnTo));
    } catch (error) {
      if (error.code !== "GITHUB_LINK_REQUIRED") throw error;
      res.cookie(LINK_COOKIE, sign({ identity, returnTo: safeReturn(flow.returnTo) }, "github-link"), cookieOptions());
      return failure(res, error, true);
    }
  } catch (error) { return failure(res, error); }
};

export const githubLink = async (req, res) => {
  try {
    checkRequest(req);
    const pending = proof(req, LINK_COOKIE, "github-link");
    const result = await resolveGitHubUser({ identity: pending.identity, password: req.body?.password });
    clear(res, LINK_COOKIE);
    return await respondWithSession(result.user, res, 200, safeReturn(pending.returnTo));
  } catch (error) { return failure(res, error, ["GITHUB_LINK_REQUIRED", "GITHUB_PASSWORD_INVALID"].includes(error.code)); }
};

export const githubCancel = (req, res) => {
  try {
    if (!req.is("application/json") || !config.corsOrigins?.includes(req.get("origin"))) throw new ApiError(403, "This sign-in request is not allowed.");
    clear(res, FLOW_COOKIE); clear(res, LINK_COOKIE);
    return res.set("Cache-Control", "no-store").json(new ApiResponse(200, {}));
  } catch (error) { return failure(res, error); }
};
