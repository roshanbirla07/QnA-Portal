# Google sign-in setup

Email/password login remains available. Google sign-in uses Google Identity Services (GIS) popup credentials, verified on the backend by Google's official Node library. It does not request access to Gmail, Drive, or other Google APIs.

## Google Cloud Console

On [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients):

1. Select the project's Web application OAuth client, or create one named QnA Portal Web.
2. Add the exact frontend origin under Authorized JavaScript origins. For local development add `http://localhost` and `http://localhost:3000`. For production use the actual HTTPS frontend domain, including a nonstandard port if applicable, without a path or trailing slash.
3. This implementation uses popup callbacks, so it needs no authorized redirect URI. Do not add the backend token endpoint as a redirect URI.
4. Complete Branding and Audience configuration. If Google requires test users for your project's testing status, add the accounts that will test sign-in.
5. Copy the public Client ID ending in `.apps.googleusercontent.com`. No client secret is used or sent to the browser.

Google's setup requirements, origin rules, and console requirements remain authoritative: [GIS setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## QnA configuration

Add the public ID to the **selected backend environment config**:

```js
export const googleClientId = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";
```

The existing loader chooses prod → stage → dev → local and stops at the first available module; it does not merge settings from lower-priority files. Keep this setting alongside the existing `jwtSecret`, exact `corsOrigins`, `cookieSecure`, and `cookieSameSite` settings in that module. Do not commit instance config or secrets. There is no new frontend config key: `GET /api/v1/user/auth-config` exposes only the public Client ID, or `null` when Google sign-in is unavailable.

Add the exact frontend origin to backend `corsOrigins`, too. Google authentication deliberately requires an exact origin match, even if generic CORS separately permits preview deployments. Production must use HTTPS. Prefer a frontend-domain reverse proxy to the API. If the frontend and API are cross-site, the existing cookie settings must permit that arrangement (`cookieSecure: true`, `cookieSameSite: "none"`); browsers that block third-party cookies may still prevent cross-site nonce/session delivery.

If your proxy sets a Content Security Policy or Cross-Origin-Opener-Policy, permit Google's maintained GIS script/frames and popup interaction according to Google's setup documentation. The SDK is loaded directly from `https://accounts.google.com/gsi/client`, never self-hosted.

Restart the backend after editing its config. Enabling or changing the public ID requires no frontend rebuild. Without a Client ID or signing secret, the UI explains that Google is unavailable and leaves email/password usable.

## Account and security behavior

- A random nonce is bound to a signed, HttpOnly, browser-session cookie scoped to the Google auth endpoints. The Google ID token must carry that nonce. The library checks the Google signature, audience, issuer, and expiration; the app additionally checks a nonempty subject and verified-email claim. The nonce cookie is cleared after success or a non-recoverable failure. It is not a server-side one-use token store; the Google token's expiry remains independently enforced.
- The stable Google `sub` identifies a returning account. Browser-supplied emails, names, roles, or user IDs cannot authenticate a user. Google name claims can seed a new display name; profiles remain unpublished by default.
- Existing email/password users must confirm their QnA password to link a matching Google identity. Email matching alone never merges accounts. A different existing Google subject cannot be replaced. Existing role, profile, and visibility remain unchanged.
- Google-only users have no password hash and use Google to sign in. Existing password users retain their password login after linking. No password reset or password-setting feature is added.
- Both methods issue the existing QnA JWT and HttpOnly auth cookie. The existing browser session strategy remains intact. Google credentials and confirmation passwords stay in memory/request bodies; they are not put in URLs, persistent storage, logs, or API responses.
- Credential endpoints require JSON. Browser requests must use a configured origin; Google challenge/sign-in additionally reject absent origins. Non-browser JSON email/password clients remain supported without an Origin header.
- Provider cancellation does not submit a QnA login or block password login. Script/network failures have a retry. Protected routes remember their local destination after either sign-in method.

## Database prerequisite

The User schema adds an optional, sparse, unique `googleSubject` index. Existing records need no backfill. Verify the unique index exists before enabling Google in an environment where automatic index creation is disabled:

```js
// In the intended MongoDB database, with a database administrator's access:
db.users.createIndex({ googleSubject: 1 }, { unique: true, sparse: true });
```

Do not populate missing subjects with null or an empty string. Existing password hashes remain unchanged.

## Validation limits

Automated checks exercise provider-signed token fixtures, rejection cases, account linking, cookie/origin protections, and the UI. A live Google account/consent test requires your real public Client ID, authorized frontend origin, browser session, and database. The signed-in Console was not accessible from this chat; no Cloud project settings were changed.
