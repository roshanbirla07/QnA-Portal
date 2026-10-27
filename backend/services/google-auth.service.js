import { OAuth2Client } from "google-auth-library";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";

export const googleAuthClient = new OAuth2Client();
const linkRequired = () => Object.assign(new ApiError(409, "Confirm your existing QnA password to link Google."), { code: "GOOGLE_LINK_REQUIRED" });

// Google subject, not email or client-provided profile fields, identifies returning users.
export const resolveGoogleUser = async ({ credential, nonce, clientId, password }) => {
  if (typeof clientId !== "string" || !clientId) throw new ApiError(503, "Google sign-in is unavailable.");
  if (typeof credential !== "string" || !credential || typeof nonce !== "string" || !nonce) {
    throw new ApiError(401, "Start Google sign-in again.");
  }
  let payload;
  try {
    const ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Google sign-in could not be verified. Please try again.");
  }
  if (!payload || typeof payload.sub !== "string" || !payload.sub || payload.email_verified !== true ||
      typeof payload.email !== "string" || !payload.email.includes("@") || payload.nonce !== nonce) {
    throw new ApiError(401, "Google sign-in could not be verified. Please try again.");
  }
  const returning = await User.findOne({ googleSubject: payload.sub });
  if (returning) return { user: returning, created: false };

  const email = payload.email.trim().toLowerCase();
  const existing = await User.findOne({ email }).select("+googleSubject");
  if (existing) {
    if (existing.googleSubject && existing.googleSubject !== payload.sub) {
      throw new ApiError(409, "Use the sign-in method already connected to this account.");
    }
    if (typeof password !== "string" || !password) throw linkRequired();
    if (!await existing.isPasswordCorrect(password)) {
      throw Object.assign(new ApiError(401, "The password could not be verified. Try again."), { code: "GOOGLE_PASSWORD_INVALID" });
    }
    // Only link after proof of both identities. Do not overwrite roles, profile, or visibility.
    const linked = await User.findOneAndUpdate(
      { _id: existing._id, $or: [{ googleSubject: { $exists: false } }, { googleSubject: payload.sub }] },
      { $set: { googleSubject: payload.sub } }, { new: true, runValidators: true },
    );
    if (!linked) throw new ApiError(409, "This account changed. Start Google sign-in again.");
    return { user: linked, created: false };
  }
  try {
    const user = await User.create({
      email, googleSubject: payload.sub, roleType: "user",
      displayName: typeof payload.name === "string" ? payload.name.trim().slice(0, User.schema.path("displayName").options.maxlength) : undefined,
    });
    return { user, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    // Concurrent first sign-ins can race on either unique index. Never merge by email.
    const winner = await User.findOne({ googleSubject: payload.sub });
    if (winner) return { user: winner, created: false };
    throw linkRequired();
  }
};
