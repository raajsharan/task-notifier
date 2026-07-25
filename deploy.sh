#!/usr/bin/env bash
#
# One-shot Ubuntu Server 24.04 deployment for the Task Manager app.
#
# Usage:
#   1. Copy this whole project folder onto the server, e.g. to /task_notifier
#   2. cd /task_notifier
#   3. sudo ./deploy.sh
#
# It installs PostgreSQL/Nginx/Node.js if missing, creates the app database,
# installs backend + frontend dependencies, builds the frontend, writes a
# systemd service for the backend, and configures Nginx to serve the
# frontend + reverse-proxy /api to the backend on port 8001.
#
# Re-running it is safe — each step skips work that's already done.
#
# Override any of these by exporting them before running the script, e.g.:
#   SERVER_NAME=example.com JWT_SECRET_KEY=... sudo -E ./deploy.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${DB_NAME:-tasknotifier}"
DB_USER="${DB_USER:-taskuser}"
DB_PASS="${DB_PASS:-taskpass}"
SERVER_NAME="${SERVER_NAME:-_}"          # nginx server_name; "_" = accept any host/IP
PORT="${PORT:-8001}"
SERVICE_NAME="${SERVICE_NAME:-task-manager-backend}"
NGINX_SITE="${NGINX_SITE:-task-manager}"
JWT_SECRET_KEY="${JWT_SECRET_KEY:-$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)}"

if [[ $EUID -ne 0 ]]; then
  echo "Run this with sudo: sudo ./deploy.sh" >&2
  exit 1
fi

echo "==> App directory: $APP_DIR"

echo "==> Installing system packages (postgresql, nginx, curl, git)..."
apt update -y
apt install -y postgresql postgresql-contrib nginx git curl

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "==> Node $(node --version), npm $(npm --version)"

echo "==> Ensuring PostgreSQL database/user exist..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

echo "==> Backend: installing dependencies..."
cd "$APP_DIR/backend"
npm install --omit=dev

if [[ ! -f .env ]]; then
  echo "==> Writing backend/.env..."
  cat > .env <<EOF
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_ORIGIN=http://${SERVER_NAME}
PORT=${PORT}
EOF
else
  echo "==> backend/.env already exists, leaving it untouched."
fi

echo "==> Writing systemd service /etc/systemd/system/${SERVICE_NAME}.service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Task Manager Express backend
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=${APP_DIR}/backend
ExecStart=$(command -v node) src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "==> Frontend: installing dependencies and building..."
cd "$APP_DIR/frontend"
npm install
echo "VITE_API_BASE=" > .env.production   # empty = same-origin, proxied by Nginx below
npm run build

echo "==> Handing project ownership to www-data..."
chown -R www-data:www-data "$APP_DIR"

echo "==> Enabling backend service..."
systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"

echo "==> Writing Nginx site /etc/nginx/sites-available/${NGINX_SITE}..."
cat > "/etc/nginx/sites-available/${NGINX_SITE}" <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    root ${APP_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${PORT}/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if command -v ufw >/dev/null 2>&1; then
  echo "==> Configuring firewall..."
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
fi

echo ""
echo "==> Done. Backend status:"
systemctl status "${SERVICE_NAME}" --no-pager -l | head -n 5
echo ""
echo "Visit http://${SERVER_NAME} (or your server's IP) to use the app."
echo "Health check: curl http://127.0.0.1:${PORT}/api/health"
