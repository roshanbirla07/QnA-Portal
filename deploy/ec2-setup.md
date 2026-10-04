# EC2 Setup Commands

Run these on a fresh Ubuntu EC2 instance. The root `npm start` script launches development servers. Its backend watcher uses Node.js 20's built-in `--watch` flag, so `nodemon` is not required. For a production deployment, use the build, PM2, and Nginx steps below.

```bash
sudo apt update
sudo apt install -y nginx git curl

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2

sudo mkdir -p /var/www
cd /var/www
sudo git clone <repo-url> qna-portal
sudo chown -R "$USER":"$USER" /var/www/qna-portal

cd /var/www/qna-portal
npm ci

# Create backend/config/stage_config.js with named exports for port,
# mongodbUri, jwtSecret, corsOrigins, cookieSecure, and cookieSameSite.
# Replace placeholders with your own values. Keep this ignored file on the instance.
# For Atlas passwords containing @ or other URI special characters, use:
# export const mongodbUri = "mongodb+srv://cluster0.example.mongodb.net/?appName=Cluster0";
# export const mongodbUsername = "your-database-user";
# export const mongodbPassword = "your-raw-password";
# The optional mongodbAuthSource defaults to "admin" with separate credentials.
# Remove username and password from mongodbUri when using these fields.
# Example: export const corsOrigins = ["https://your-domain.com"];
# backend/config/variables.js selects prod_config.js first, then stage_config.js,
# then dev_config.js, then local_config.js. Remove a higher-priority config
# if stage_config.js should be active.

# Create frontend/public/stage_config.js for the browser API origin.
# With this Nginx config, the frontend and API share an origin, so use:
# window.__APP_CONFIG__ = {
#   ...(window.__APP_CONFIG__ || {}),
#   stage: { apiBaseUrl: "" }
# };
# Use the full API origin instead if the API is hosted separately.
# Frontend config scripts load local, dev, stage, then prod; prod wins.

npm run build --prefix frontend
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

sudo cp deploy/nginx-qna-portal.conf /etc/nginx/sites-available/qna-portal
sudo ln -s /etc/nginx/sites-available/qna-portal /etc/nginx/sites-enabled/qna-portal
sudo nginx -t
sudo systemctl reload nginx
```

After DNS points to EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Periodic job source checks

After the application is configured and running, install the six-hour timer on the EC2 host. Adjust the service's `User`, `WorkingDirectory`, and npm path if your deployment differs from the example above.

```bash
sudo cp deploy/qna-stale-jobs.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now qna-stale-jobs.timer
sudo systemctl start qna-stale-jobs.service
sudo journalctl -u qna-stale-jobs.service -n 50 --no-pager
```

Each run checks at most 100 published listings not checked in the previous 24 hours. A successful title preview marks a listing verified. Two consecutive failures flag it as possibly closed for review; a check never automatically closes or removes it. On sites that block automated requests, the flag may need manual review.
