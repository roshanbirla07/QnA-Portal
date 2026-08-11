# EC2 Setup Commands

Run these on a fresh Ubuntu EC2 instance.

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

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files before continuing.

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
