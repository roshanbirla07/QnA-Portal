import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/variables.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { resolveGoogleUser } from "../services/google-auth.service.js";
import { respondWithSession } from "./user.controllers.js";

const nonceCookie = "googleSignInNonce";
const cookieOptions = () => ({ httpOnly: true, secure: config.cookieSecure, sameSite: config.cookieSameSite, path: "/api/v1/user/google" });
const enabled = () => typeof config.googleClientId === "string" && config.googleClientId.endsWith(".apps.googleusercontent.com") && Boolean(config.jwtSecret);
const checkRequest = (req) => {
  if (!enabled()) throw new ApiError(503, "Google sign-in is unavailable. Use email and password.");
  // JSON requests and an exact configured origin are required, independently of CORS.
  if (!req.is("application/json") || !config.corsOrigins?.includes(req.get("origin"))) {
    throw new ApiError(403, "This sign-in request is not allowed.");
  }
};

export const getAuthConfig = (req, res) => res.set("Cache-Control", "no-store")
  .json(new ApiResponse(200, { googleClientId: enabled() ? config.googleClientId : null }));

export const googleChallenge = (req, res) => {
  try {
    checkRequest(req);
    const nonce = randomBytes(32).toString("base64url");
    // Session cookie: ID-token expiry is independently enforced by Google's verifier.
    const signedNonce = jwt.sign({ nonce, purpose: "google-sign-in" }, config.jwtSecret, { algorithm: "HS256" });
    res.cookie(nonceCookie, signedNonce, cookieOptions());
    return res.set("Cache-Control", "no-store").json(new ApiResponse(200, { nonce }));
  } catch (error) {
    return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, {}, error instanceof ApiError ? error.message : "Google sign-in is unavailable."));
  }
};

export const googleSignIn = async (req, res) => {
  try {
    checkRequest(req);
    const credential = req.body?.credential;
    if (typeof credential !== "string" || !credential) throw new ApiError(400, "Start Google sign-in again.");
    let challenge;
    try { challenge = jwt.verify(req.cookies?.[nonceCookie], config.jwtSecret, { algorithms: ["HS256"] }); }
    catch { throw new ApiError(401, "Your sign-in session ended. Start Google sign-in again."); }
    if (challenge.purpose !== "google-sign-in" || typeof challenge.nonce !== "string" || !challenge.nonce) {
      throw new ApiError(401, "Start Google sign-in again.");
    }
    const result = await resolveGoogleUser({ credential, nonce: challenge.nonce, clientId: config.googleClientId, password: req.body?.password });
    res.clearCookie(nonceCookie, cookieOptions());
    return await respondWithSession(result.user, res, result.created ? 201 : 200);
  } catch (error) {
    const recoverable = ["GOOGLE_LINK_REQUIRED", "GOOGLE_PASSWORD_INVALID"].includes(error.code);
    if (!recoverable) res.clearCookie(nonceCookie, cookieOptions());
    const status = error instanceof ApiError ? error.statusCode : 500;
    // No provider token, password, or verifier error is logged or returned.
    return res.status(status).json(new ApiResponse(status, { code: recoverable ? error.code : undefined },
      error instanceof ApiError ? error.message : "Google sign-in could not finish. Please try again."));
  }
};
