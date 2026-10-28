import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";

const linkRequired = () => Object.assign(new ApiError(409, "Confirm your existing QnA password to link GitHub."), { code: "GITHUB_LINK_REQUIRED" });

// Called only with identity verified server-side or recovered from a signed linking cookie.
export const resolveGitHubUser = async ({ identity, password }) => {
  const returning = await User.findOne({ githubSubject: identity.id });
  if (returning) return { user: returning, created: false };

  const email = identity.email.trim().toLowerCase();
  const existing = await User.findOne({ email }).select("+githubSubject");
  if (existing) {
    if (existing.githubSubject && existing.githubSubject !== identity.id) {
      throw new ApiError(409, "Use the sign-in method already connected to this account.");
    }
    if (typeof password !== "string" || !password) throw linkRequired();
    if (!await existing.isPasswordCorrect(password)) {
      throw Object.assign(new ApiError(401, "The password could not be verified. Try again."), { code: "GITHUB_PASSWORD_INVALID" });
    }
    // Only link after proof of both identities. Do not overwrite roles, profile, or visibility.
    const linked = await User.findOneAndUpdate(
      { _id: existing._id, $or: [{ githubSubject: { $exists: false } }, { githubSubject: identity.id }] },
      { $set: { githubSubject: identity.id } }, { new: true, runValidators: true },
    );
    if (!linked) throw new ApiError(409, "This account changed. Start GitHub sign-in again.");
    return { user: linked, created: false };
  }
  try {
    const user = await User.create({
      email, githubSubject: identity.id, roleType: "user",
      displayName: typeof identity.name === "string" ? identity.name.trim().slice(0, User.schema.path("displayName").options.maxlength) : undefined,
    });
    return { user, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    // Concurrent first sign-ins can race on either unique index. Never merge by email.
    const winner = await User.findOne({ githubSubject: identity.id });
    if (winner) return { user: winner, created: false };
    throw linkRequired();
  }
};
