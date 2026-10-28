# GitHub sign-in setup

Email/password login remains available. GitHub replaces the previously proposed Google sign-in; the Google SDK, dependency, routes, schema field and configuration consumer are removed. This PR was not deployed by this change. If an earlier Google-only build was separately deployed and has users, migrate those users deliberately before replacing it; removing an identity provider is not a password recovery mechanism.

## Register an OAuth App

Open [GitHub → Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new).

For the supplied development frontend:

| Field | Value |
| --- | --- |
| Application name | QnA Portal |
| Homepage URL | `http://43.204.135.20:3000/` |
| Authorization callback URL | `http://43.204.135.20:3000/auth/github/callback` |

The callback is a **frontend route**, not the backend exchange endpoint. The frontend posts code/state to the backend using the browser-bound HttpOnly proof. Register this exact callback URL; disable wildcard callback matching. The frontend server must serve the SPA for direct visits to `/auth/github/callback`. Local testing can use `http://localhost:3000/auth/github/callback` in a separate OAuth client/configuration. Each running backend is configured for one callback origin.

Register the app, copy its Client ID, and generate a Client Secret. Keep the secret only in the backend's existing ignored environment configuration or deployment secret system. Do not put it in frontend config, a public repository, screenshots, URLs, or a chat message. Device flow is not used. No repository scopes are requested; only `user:email` is requested to check the authenticated account's verified primary email. Login does not grant QnA access to private repositories or synchronize developer activity.

HTTP/IP is a development arrangement. Use an HTTPS domain and update both the GitHub registration and backend config before public production use: HTTP exposes callback codes, cookies and sessions to network observers.

## Backend configuration

In the **selected backend environment config**, alongside the existing auth/cookie settings:

```js
export const githubClientId = "YOUR_GITHUB_CLIENT_ID";
export const githubClientSecret = "YOUR_SERVER_ONLY_CLIENT_SECRET";
export const githubRedirectUri = "http://43.204.135.20:3000/auth/github/callback";
export const githubRequestTimeoutMs = 10000;
```

The existing loader selects prod → stage → dev → local and stops at the first available module; configuration is not merged. The secret above is a placeholder; never commit instance configs. `GET /api/v1/user/auth-config` returns only `{ githubEnabled: boolean }`. There is no new frontend configuration key and no client secret in that response. Restart the backend after changing config.

- Include the exact frontend origin `http://43.204.135.20:3000` in backend `corsOrigins`. The start endpoint requires the initiating origin to equal the configured callback origin.
- Keep frontend `apiBaseUrl` pointed to the reachable backend. Existing `jwtSecret`, `cookieSecure`, and `cookieSameSite` apply to session and short-lived flow cookies.
- With HTTP on the same IP (including different ports), use `cookieSecure: false` and `cookieSameSite: "lax"` for development. Secure cookies require HTTPS.
- For production, prefer frontend and API on the same HTTPS origin using a reverse proxy; use secure cookies. A genuinely cross-site API needs `SameSite=None; Secure`, and browser third-party-cookie restrictions may still interfere.
- Serve the callback route with `Referrer-Policy: strict-origin` or stronger, and avoid logging callback query strings. The SPA includes a strict-origin referrer meta policy and strips code/state before exchanging them. A reload after URL cleanup requires starting sign-in again.

Without complete configuration, Google is absent and GitHub is shown as unavailable; email/password remains functional. No Cloud Console configuration is required.

## Authentication and privacy

1. An explicit click obtains an authorization URL. The backend creates a random state and PKCE verifier, puts them in a signed HttpOnly ten-minute cookie, and sends only the S256 challenge to GitHub.
2. GitHub redirects to the frontend callback with a temporary code/state. The backend checks the browser cookie and state before exchanging the code with its client secret and verifier.
3. The backend calls authenticated `/user` and `/user/emails` with the returned access token. It requires a positive numeric GitHub ID and a verified primary email, including private primary emails. Public profile email alone is not accepted. No fabricated fallback email is created.
4. Returning accounts resolve by the stable GitHub ID, preserving role, profile and email. A new account gets role `user`, no password hash and an unpublished profile. GitHub-only users continue using GitHub; this change adds no password reset/setting feature.
5. An existing matching email requires the QnA password. A signed HttpOnly pending-identity cookie supports confirmation retries without reusing a consumed GitHub code. A different linked GitHub identity cannot be replaced. Cancel clears the proof. Proofs expire in ten minutes; they are not a server-side one-use ledger.
6. Both methods issue the existing QnA JWT and HttpOnly session cookie. GitHub access/refresh tokens are discarded after identity checks, not returned, logged, stored in MongoDB or browser storage. The existing app-session persistence strategy is unchanged.

GitHub credentials are separate from publicly connected developer accounts. Authentication never automatically publishes an account or invents GitHub activity.

## Database prerequisite

The optional `githubSubject` field is sparse, unique and hidden from default selections. Existing password accounts need no backfill. If automatic index creation is disabled, verify/create the index in the intended MongoDB database before activation:

```js
db.users.createIndex({ githubSubject: 1 }, { unique: true, sparse: true });
```

Do not populate missing subjects with null or an empty string. Existing passwords remain unchanged. No production index or database is changed by this PR.

## Validation limits and references

Automated provider/DB fixtures exercise account creation/return/linking, code exchange inputs, provider failures, missing/expired/tampered proofs, origin and JSON checks, session issuance, callback cleanup, cancellation/retry and local credentials. A live end-to-end test still requires a real configured OAuth App and target MongoDB. Fixture checks are not presented as a live GitHub login.

- [GitHub OAuth registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [GitHub web authorization flow, state, PKCE and callback matching](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Authenticated GitHub email API](https://docs.github.com/en/rest/users/emails)
