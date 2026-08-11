# QnA Portal EC2 Deployment Plan

## Completed in repo

- [x] Remove production dependency on hardcoded MongoDB/JWT secrets.
- [x] Make backend config environment-driven.
- [x] Support MongoDB SRV URIs with query strings.
- [x] Add deploy-safe cookie configuration for HTTP dev and HTTPS production.
- [x] Send bearer auth headers from the frontend so auth works even when secure cookies are unavailable on HTTP dev EC2.
- [x] Add backend `.env.example`.
- [x] Add frontend `.env.example`.
- [x] Add PM2 ecosystem config for backend process management.
- [x] Add one-time admin seed script.
- [x] Add frontend smoke test dependencies and app render test.
- [x] Validate lint, frontend test, frontend build, and live backend user-flow smoke suite.
- [x] Restart backend with provided MongoDB URI and validate live auth/question/comment smoke flow.

## EC2 tasks to run on the server

- [ ] Provision Ubuntu EC2 instance.
- [ ] Open security group ports: `22`, `80`, `443`.
- [ ] Install Node.js LTS, npm, nginx, git, and PM2.
- [ ] Clone repository to `/var/www/qna-portal`.
- [ ] Create `backend/.env` from `backend/.env.example`.
- [ ] Create `frontend/.env` from `frontend/.env.example`.
- [ ] Run `npm ci` at repo root.
- [ ] Build frontend with `npm run build --prefix frontend`.
- [ ] Serve frontend build with nginx.
- [ ] Reverse proxy `/api` or backend subdomain to `localhost:3001`.
- [ ] Start backend with `pm2 start ecosystem.config.cjs`.
- [ ] Save PM2 startup config with `pm2 save` and `pm2 startup`.
- [ ] Create first admin with `npm run seed:admin --prefix backend`.
- [ ] Attach domain DNS record to EC2 public IP.
- [ ] Install TLS certificate with Certbot.
- [ ] Set `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, and exact `CORS_ORIGINS` once HTTPS is active.
- [ ] Run production smoke tests after deployment.

## Inputs still needed

- [ ] EC2 public IP or DNS name.
- [ ] Domain/subdomain choice.
- [ ] Final frontend URL.
- [ ] Final backend API URL.
- [ ] Production `JWT_SECRET`.
- [ ] Production MongoDB URI.
- [ ] Initial admin email/password.
- [ ] SSH key or AWS access path for actual deployment.
