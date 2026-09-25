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
