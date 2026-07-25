# Task Manager

A daily task manager with:
- **User accounts** — register/login, each user's tasks are private to them
- Tasks grouped into **Today**, **Pending/Overdue**, and **Upcoming**

```
teams-task-notifier/
├── backend/     FastAPI app (auth + task API, PostgreSQL-backed)
└── frontend/    React (Vite) task manager UI, with login/register screens
```

> **Deploying to Ubuntu Server 24.04?** See
> [`UBUNTU_SERVER_SETUP.md`](./UBUNTU_SERVER_SETUP.md) for the full guide —
> native PostgreSQL, a `systemd` service for the backend, and Nginx serving
> the built frontend + reverse-proxying the API. That's the recommended path
> for anything beyond your own machine.
>
> Developing locally on Windows instead? See
> [`WINDOWS_SETUP.md`](./WINDOWS_SETUP.md).

---

## Local development (macOS/Linux)

### 1. PostgreSQL

Install Postgres locally, then create the database:
```bash
sudo -u postgres psql
```
```sql
CREATE USER taskuser WITH PASSWORD 'taskpass';
CREATE DATABASE tasknotifier OWNER taskuser;
GRANT ALL PRIVILEGES ON DATABASE tasknotifier TO taskuser;
\q
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` — at minimum, set a real `JWT_SECRET_KEY`:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Run it:
```bash
uvicorn app.main:app --reload --port 8000
```
On first run, SQLAlchemy auto-creates the `users` and `tasks` tables.
Check `http://localhost:8000/api/health` → `{"status":"ok"}`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` — you'll land on a login/register screen.
Register an account, then log in to manage tasks.

---

## How auth works

- Passwords are hashed with bcrypt (`passlib`) before being stored — never
  in plain text.
- `/api/auth/register` creates an account, `/api/auth/login` returns a JWT
  access token, `/api/auth/me` returns the current user.
- The frontend stores the token in `localStorage` and attaches it as
  `Authorization: Bearer <token>` on every API call (see `src/api.js`).
- Every task is tied to an `owner_id`; all task endpoints filter by the
  logged-in user, so users only ever see their own tasks.
- Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 24h, set in
  `.env`) — after that, the user needs to log in again.

## API reference

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | no | Create an account |
| POST | `/api/auth/login` | no | Get a JWT access token |
| GET | `/api/auth/me` | yes | Current user info |
| GET | `/api/tasks` | yes | List your tasks |
| POST | `/api/tasks` | yes | Create a task |
| PATCH | `/api/tasks/{id}` | yes | Update a task |
| DELETE | `/api/tasks/{id}` | yes | Delete a task |
| GET | `/api/health` | no | Health check |

## Notes / next steps

- **Password reset / email verification**: not included — add an email
  service (e.g. SMTP or a provider like Postmark/SendGrid) if you need it.
- **Refresh tokens**: currently a single long-lived access token; for a
  production app with shorter-lived tokens, add a refresh-token flow.
- **Production secrets**: never commit a real `JWT_SECRET_KEY` or database
  password — keep `.env` out of version control (already covered by a
  typical `.gitignore`) and rotate secrets if they're ever exposed.
