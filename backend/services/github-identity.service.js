import config from "../config/variables.js";
import ApiError from "../utils/ApiError.js";

// Provider endpoints and protocol names are fixed; credentials stay in backend config.
export const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";
const EMAILS_URL = "https://api.github.com/user/emails";
const request = async (url, options) => {
  try {
    const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(config.githubRequestTimeoutMs) });
    if (!response.ok) throw new Error("Provider rejected request");
    return await response.json();
  } catch {
    throw new ApiError(502, "GitHub sign-in could not finish. Please try again.");
  }
};

export const exchangeGitHubIdentity = async (code, verifier) => {
  const token = await request(TOKEN_URL, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.githubClientId, client_secret: config.githubClientSecret,
      redirect_uri: config.githubRedirectUri, code, code_verifier: verifier }) });
  if (token.error || typeof token.access_token !== "string" || !token.access_token || token.token_type?.toLowerCase() !== "bearer") {
    throw new ApiError(401, "GitHub sign-in expired or was declined. Start again.");
  }
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token.access_token}`, "User-Agent": "QnA-Portal" };
  // Always revalidate identity for this token. Public profile email is not proof of ownership.
  const user = await request(USER_URL, { headers });
  if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new ApiError(401, "GitHub identity could not be verified.");
  const emails = await request(EMAILS_URL, { headers });
  const email = Array.isArray(emails) && emails.find((entry) => entry.primary === true && entry.verified === true && typeof entry.email === "string" && entry.email.includes("@"));
  if (!email) throw new ApiError(401, "Verify your primary email on GitHub, then try again.");
  // Do not persist or return GitHub access/refresh tokens or the private email list.
  return { id: String(user.id), email: email.email.trim().toLowerCase(), name: typeof user.name === "string" ? user.name : undefined };
};
