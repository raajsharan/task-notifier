# Ubuntu Server 24.04 Setup

Deploys the app on a plain Ubuntu Server 24.04 box: PostgreSQL, the Express
(Node.js) backend running as a `systemd` service, and the React frontend
built to static files and served by Nginx (which also reverse-proxies `/api`
to the backend). No Docker required.

Run everything below over SSH as a user with `sudo` rights.

---

## 1. System packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib nginx git curl
```

Install Node.js 20 LTS (Ubuntu's default apt repo often has an older version):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x
```

## 2. PostgreSQL: create the database and user

```bash
sudo -u postgres psql
```
At the `postgres=#` prompt:
```sql
CREATE USER taskuser WITH PASSWORD 'taskpass';
CREATE DATABASE tasknotifier OWNER taskuser;
GRANT ALL PRIVILEGES ON DATABASE tasknotifier TO taskuser;
\q
```
(Use a stronger password for anything beyond a personal/internal server —
just keep `.env` in step 4 in sync.)

Postgres on Ubuntu listens on localhost by default, which is all this needs
since the backend runs on the same box.

## 3. Get the project onto the server

```bash
sudo mkdir /task_notifier && sudo chown $USER:$USER /task_notifier
cd /task_notifier
# copy the project here — e.g. scp the zip up and unzip, or git clone your own repo
unzip ~/teams-task-notifier.zip -d .
mv teams-task-notifier/* .
rmdir teams-task-notifier
```

## 4. Backend: npm install + systemd service

```bash
cd /task_notifier/backend
npm install --omit=dev
cp .env.example .env
```

Edit `.env`:
```bash
nano .env
```
Set at minimum:
```
DATABASE_URL=postgres://taskuser:taskpass@localhost:5432/tasknotifier
JWT_SECRET_KEY=<generate one — see below>
FRONTEND_ORIGIN=http://your-server-ip-or-domain
PORT=8001
```
Generate a real secret instead of the placeholder:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Test it runs:
```bash
node src/server.js
```
Ctrl+C once you see it start cleanly and `curl localhost:8001/api/health`
returns `{"status":"ok"}`.

Now make it a proper service so it survives reboots and crashes. Create
`/etc/systemd/system/task-manager-backend.service`:

```bash
sudo nano /etc/systemd/system/task-manager-backend.service
```
```ini
[Unit]
Description=Task Manager Express backend
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/task_notifier/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Make sure `www-data` can read the project files:
```bash
sudo chown -R www-data:www-data /task_notifier
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now task-manager-backend
sudo systemctl status task-manager-backend
```

## 5. Frontend: build static files

```bash
cd /task_notifier/frontend
npm install
```

Set the API base to go through Nginx's same-origin proxy instead of a raw
port — create `.env.production`:
```bash
echo "VITE_API_BASE=" > .env.production
```
(Leaving it empty makes axios use relative URLs like `/api/tasks`, which
Nginx below will proxy to the backend.)

Build:
```bash
npm run build
```
This produces static files in `frontend/dist/`.

## 6. Nginx: serve the frontend + proxy the API

```bash
sudo nano /etc/nginx/sites-available/task-manager
```
```nginx
server {
    listen 80;
    server_name your-server-ip-or-domain;

    root /task_notifier/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 8. Try it

Visit `http://your-server-ip-or-domain` in a browser — you should see the
login/register screen. Register an account, log in, and start adding tasks.

## 9. Optional: HTTPS with a real domain

If you point a domain name at the server, add free HTTPS with Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
It edits the Nginx config automatically and sets up auto-renewal.

---

## Redeploying after code changes

```bash
# backend
cd /task_notifier/backend
npm install --omit=dev   # if dependencies changed
sudo systemctl restart task-manager-backend

# frontend
cd /task_notifier/frontend
npm install
npm run build                    # dist/ is served directly by Nginx, no restart needed
```

## Troubleshooting

- **502 Bad Gateway from Nginx**: the backend service isn't running —
  check `sudo systemctl status task-manager-backend` and
  `journalctl -u task-manager-backend -n 50`.
- **CORS errors in browser console**: `FRONTEND_ORIGIN` in `.env` doesn't
  match the URL you're actually visiting — update it and restart the
  backend service. (With the Nginx same-origin proxy in step 6, this
  shouldn't come up since frontend and API share an origin.)
- **Can't connect to Postgres**: `sudo systemctl status postgresql`, and
  double-check the credentials in `.env` match what you created in step 2.
