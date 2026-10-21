# QnA Portal

A developer community platform for sharing technical knowledge, building visible expertise, and discovering career opportunities.

QnA Portal brings questions, articles, topic reputation, developer profiles, and job discussions into one place. Developers can learn from community contributions and showcase their work; recruiters and collaborators can explore public profiles with links and signals from external platforms.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Optional integrations](#optional-integrations)
- [API overview](#api-overview)
- [Development commands](#development-commands)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

The project connects three parts of a developer's journey:

1. **Learn and contribute:** ask questions, write articles, answer others, and follow technical topics.
2. **Build visible expertise:** earn reputation through community interactions and bring public coding and writing activity into a developer profile.
3. **Find opportunities:** browse shared jobs, discuss openings, request referrals, discover collaborators, and explore matches based on profile information and topic expertise.

The repository contains a React web application and an Express API backed by MongoDB. Optional OpenSearch and OpenAI integrations add keyword search, semantic discovery, and a source-citing knowledge assistant.

## Features

| Area | Implemented capabilities |
| --- | --- |
| Knowledge sharing | Questions and articles, answers, accepted answers, comments, votes, bookmarks, and public post pages. |
| Topics and reputation | Topic pages and follows, reputation events, topic-specific reputation, expert discovery, and rankings. |
| Developer profiles | Public candidate discovery, visibility controls, opportunity preferences, and linked GitHub, Codeforces, LeetCode, and Medium accounts. |
| External profile sync | Selected public metrics and skill signals, source links, sync timestamps, and status reporting. |
| Jobs and referrals | Job-link previews, a job board, discussions, referral requests, profile-based job matches, and periodic source checks that flag potentially stale listings. |
| Company insights | Company pages, interview experiences, company reviews, and salary insights. |
| Community and collaboration | Communities, projects, project applications, and purpose-based connection requests. |
| Search and AI | Optional keyword search and autocomplete, semantic search and related posts, and a knowledge assistant using published community sources. |
| Accounts and moderation | Email/password authentication, JWT cookies, user/admin roles, and question moderation workflows. |

External account sync imports a selected public snapshot; it does not retrieve all platform data or prove that the person linking a handle owns that external account. Job matches use weighted profile and topic signals rather than an LLM.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Web application | React 18, React Router 6, Axios, Tailwind CSS, Framer Motion, React Markdown. |
| API | Node.js, Express 4, JavaScript ES modules. |
| Persistence | MongoDB and Mongoose 8. |
| Authentication | JSON Web Tokens, bcrypt, cookie-parser, and CORS. |
| Optional search and AI | OpenSearch, OpenAI embeddings, and the OpenAI Responses API. |
| Tooling and deployment | npm workspaces, ESLint, React Scripts, PM2, and Nginx deployment files. |

## Project structure

| Path | Purpose |
| --- | --- |
| `frontend/src/components/` | Feature screens, shared controls, and application layout. |
| `frontend/src/contexts/` | Shared React context, including authentication. |
| `frontend/src/services/` | API endpoint definitions and client services. |
| `frontend/src/config/` | Frontend configuration loader and instance-specific modules. |
| `backend/routes/` | Express route definitions. |
| `backend/controllers/` | HTTP request handling. |
| `backend/services/` | Knowledge, reputation, jobs, search, and external profile logic. |
| `backend/schemas/` | Mongoose models. |
| `backend/middlewares/` | Authentication and request middleware. |
| `backend/config/` | Backend configuration loader and instance-specific modules. |
| `backend/scripts/` | Admin seeding, migrations, reindexing, and maintenance tasks. |
| `backend/tests/` | Existing Node.js tests. |
| `deploy/` | EC2 setup notes, Nginx configuration, and systemd maintenance units. |
| `docs/` | Additional verification notes. |
| `dev-runner.js` | Starts both development processes. |

## Getting started

### Prerequisites

- Node.js 20 or newer and npm.
- A reachable MongoDB instance, locally or through MongoDB Atlas.
- Git.

OpenSearch and an OpenAI API key are only needed for the corresponding optional features.

### 1. Clone and install

```bash
git clone https://github.com/roshanbirla07/QnA-Portal.git
cd QnA-Portal
npm ci
```

The root package uses npm workspaces for `backend` and `frontend`.

### 2. Configure the backend

Create `backend/config/local_config.js` with named exports:

```javascript
export const port = 5001;
export const mongodbUri = "mongodb://127.0.0.1:27017";
export const jwtSecret = "REPLACE_WITH_A_LONG_RANDOM_SECRET";
export const corsOrigins = ["http://localhost:3000"];
export const allowVercelPreviewOrigins = false;
export const cookieSecure = false;
export const cookieSameSite = "lax";
```

Replace the JWT placeholder before starting. The database name is currently `HexaWealth`, defined in `backend/constants.js`; the connection helper adds it to the configured URI.

For Atlas, replace the local URI and supply credentials separately:

```javascript
export const mongodbUri = "mongodb+srv://YOUR_CLUSTER_HOST/?appName=Cluster0";
export const mongodbUsername = "YOUR_DATABASE_USER";
export const mongodbPassword = "YOUR_DATABASE_PASSWORD";
export const mongodbAuthSource = "admin";
```

When using separate credentials, do not also embed credentials in `mongodbUri`.

### 3. Configure the frontend

Create `frontend/src/config/local_config.js`:

```javascript
export const apiBaseUrl = "http://localhost:5001";
```

Both configuration loaders select the first available file in this order:

`prod_config.js` → `stage_config.js` → `dev_config.js` → `local_config.js`

They do not merge these files or provide fallback settings. A higher-priority file takes precedence even during local development. These instance-specific modules are ignored by Git; keep real credentials out of tracked files. Copying the existing `.env.example` files alone does not configure the current startup path.

### 4. Run the application

```bash
npm start
```

With the example configuration:

- Web application: [http://localhost:3000](http://localhost:3000).
- API: [http://localhost:5001](http://localhost:5001).

Check that the API is reachable:

```bash
curl http://localhost:5001/
```

The root endpoint returns a service-running message. Sign up through the web application to create a regular user account.

### Optional: create an administrator

Add `adminEmail`, `adminPassword`, and `adminResetPassword` named exports to the active backend config. Use a password of at least 12 characters and set `adminResetPassword` to `false` unless you intend to reset an existing account's password.

```bash
npm run seed:admin --workspace backend
```

The script creates an administrator or promotes the configured existing account.

## Optional integrations

Pass integration credentials through the backend process environment. The current entry point does not automatically load a `.env` file.

| Setting | Purpose |
| --- | --- |
| `OPENSEARCH_URL` | Enables keyword search and is also required for semantic search. |
| `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` | Optional basic authentication; supply both when required by the cluster. |
| `OPENAI_API_KEY` | Enables embeddings and the knowledge assistant when OpenSearch is configured. |
| `OPENAI_ASSISTANT_MODEL` | Overrides the assistant's configured default model. |
| `GITHUB_TOKEN` | Optional authentication for public GitHub profile API requests. |

See [OpenSearch setup](backend/SEARCH.md) and [semantic search setup](backend/VECTOR_SEARCH.md) for indexing instructions and API details. Reindex commands delete and recreate their respective search indexes; vector reindexing can incur embedding API charges. MongoDB remains the primary data store.

The knowledge assistant retrieves published questions and articles, sends source excerpts to OpenAI, and requests answers with citations. Review its output alongside the linked source posts.

GitHub, Codeforces, LeetCode, and Medium sync use external public endpoints or feeds. Availability, rate limits, and the scope of returned data depend on each provider. Interpret profile summaries alongside their source links and last sync time.

## API overview

The API is mounted under `/api/v1`. These groups are defined in `backend/app.js`; inspect their route files for individual methods, payloads, and authorization requirements.

| Route group | Purpose |
| --- | --- |
| `/user`, `/profiles`, `/developer-profiles` | Authentication, community profiles, and external developer accounts. |
| `/posts`, `/questions`, `/interactions`, `/feed` | Posts, answers, interactions, and feeds. |
| `/topics`, `/experts`, `/rankings` | Topic discovery, expertise, and rankings. |
| `/jobs`, `/referrals` | Job listings, matches, discussions, and referral requests. |
| `/companies`, `/interviews`, `/company-reviews`, `/salaries` | Company and career insights. |
| `/communities`, `/projects`, `/connections` | Community membership and collaboration. |
| `/search`, `/vector-search`, `/knowledge-assistant` | Keyword search, semantic retrieval, and source-based answers. |
| `/qna`, `/comment` | Compatibility endpoints using the canonical Post model internally. |

## Development commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm start` | Starts both development servers. |
| `npm run dev --workspace backend` | Starts the API with Node's file watcher. |
| `npm start --workspace frontend` | Starts the React development server. |
| `npm run lint --workspace backend` | Runs backend linting directly. |
| `npm run lint --workspace frontend` | Runs frontend linting directly. |
| `node --test backend/tests/*.test.js` | Runs existing backend Node.js tests. |
| `npm test --workspace frontend -- --watchAll=false` | Runs frontend tests without watch mode. |
| `npm run build --workspace frontend` | Generates the frontend production bundle. |
| `npm run migrate:qna-posts --workspace backend` | Migrates legacy QnA records into canonical posts. |
| `npm run jobs:check-stale --workspace backend` | Checks published job source links. |
| `npm run profiles:sync --workspace backend` | Refreshes a batch of public external profile accounts. |
| `npm run search:reindex --workspace backend` | Rebuilds the keyword search index. |
| `npm run vectors:reindex --workspace backend` | Rebuilds the semantic search index. |

The backend `npm test` script is currently a placeholder; use the Node.js test command above. Review maintenance scripts before running them against a live database or search cluster.

## Deployment

The repository includes a PM2 backend process configuration and Nginx deployment files for hosting the API and built frontend on EC2. See [EC2 setup](deploy/ec2-setup.md) and the [deployment plan](DEPLOYMENT_PLAN.md).

Use the configuration loaders described above as the source of truth: the current frontend reads modules from `frontend/src/config/`, so create the appropriate module before building. Older deployment notes referring to `frontend/public/*_config.js` do not match the current frontend loader. Set the API port in the active backend config; a process-level `PORT` value alone does not override it.

Configure HTTPS, the permitted frontend origin, and suitable cookie settings for your deployment. The root `npm start` command launches development servers; build the frontend and run the backend with a process manager for production.

## Contributing

1. Open an issue describing the problem or proposed improvement.
2. Create a focused branch from `main`.
3. Follow the existing code structure and keep credentials in the appropriate instance-specific files.
4. Run checks relevant to the change and update affected documentation.
5. Open a pull request with a concise description and validation results.

For interface changes, consult [DESIGN.md](DESIGN.md) and [UX-CONTRACT.md](UX-CONTRACT.md). Submit changes through pull requests for review.

## License

The backend package metadata declares `ISC`, but the repository currently has no root license file. Confirm the intended project-wide license with the maintainer before redistributing the project.

#### Developer profile setup and source limits

Visit **Developer profile** to save your QnA username, display name, headline, and publication preferences. A username is required to publish; connecting a platform alone does not publish the QnA profile. Each connected account has a separately saved public/hidden setting.

Work summaries show imported snapshots, last sync dates, and explicit unavailable/failed states. GitHub calendars come from the public, unauthenticated contribution page; the service token is never sent to that page. Publicly shared private contribution counts may appear without repository details. This HTML endpoint can change: if parsing fails, no graph is shown and repository statistics still sync. Repositories, language counts, and stars cover up to 100 recent public non-fork repos. Codeforces activity covers the most recent 200 submissions. LeetCode uses its unofficial GraphQL endpoint, and Medium shows recent RSS metadata only. Existing connected accounts need **Refresh** to import the expanded snapshot.

Run backend tests with `npm test --workspace backend`; frontend component tests with `CI=true npm test --workspace frontend -- --watchAll=false --runInBand`.
