# Windows 11 Setup (no Docker)

This walks through running everything natively on Windows 11: PostgreSQL,
the Express (Node.js) backend, and the React frontend. Commands are given
for both **PowerShell** (default Windows Terminal) and note where CMD
differs.

---

## 1. Install PostgreSQL

1. Download the Windows installer from
   https://www.postgresql.org/download/windows/ (EnterpriseDB installer).
2. Run it. During setup:
   - Keep the default port **5432**.
   - Set a password for the `postgres` superuser — remember it, you'll need
     it once in step 2.
   - You can uncheck "Stack Builder" at the end, it's not needed.
3. The installer adds PostgreSQL's `bin` folder to a shortcut menu but often
   **not** to your PATH. To run `psql` from any terminal, add it manually:
   - Search **"Edit the system environment variables"** → **Environment
     Variables** → under **System variables**, select `Path` → **Edit** →
     **New** → add:
     ```
     C:\Program Files\PostgreSQL\16\bin
     ```
     (adjust the version number `16` to whatever you installed)
   - Open a **new** PowerShell window afterward so it picks up the PATH change.

## 2. Create the app's database and user

Open PowerShell and connect as the superuser (it'll prompt for the password
you set in step 1):

```powershell
psql -U postgres
```

Then at the `postgres=#` prompt, run:

```sql
CREATE USER taskuser WITH PASSWORD 'taskpass';
CREATE DATABASE tasknotifier OWNER taskuser;
GRANT ALL PRIVILEGES ON DATABASE tasknotifier TO taskuser;
\q
```

This matches the default `DATABASE_URL` in `.env.example` exactly, so the
backend will connect with no further changes. (Feel free to pick a different
password — just update `.env` to match in step 4.)

## 3. Install Node.js

- **Node.js LTS**: https://nodejs.org/en/download

Verify in a new PowerShell window:
```powershell
node --version
npm --version
```

## 4. Backend setup

```powershell
cd backend
npm install
copy .env.example .env
```

Open `.env` in Notepad (or any editor) and fill in a real JWT secret:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```
DATABASE_URL=postgres://taskuser:taskpass@localhost:5432/tasknotifier
JWT_SECRET_KEY=<paste the generated value here>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_ORIGIN=http://localhost:5173
PORT=8001
```

Run the backend:
```powershell
npm run dev
```

Leave this PowerShell window open — it's your running server. On first run,
Sequelize auto-creates the `users` and `tasks` tables in Postgres.

Verify it's up by opening in a browser: http://localhost:8001/api/health
→ should show `{"status":"ok"}`.

## 5. Frontend setup

Open a **second** PowerShell window (leave the backend running in the first):

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser — you'll land on a
login/register screen. Register an account, then log in.

## 6. Common Windows gotchas

- **Windows Firewall prompt**: the first time `node.exe` binds to a port,
  Windows may show a firewall prompt — allow it on "Private networks" at
  minimum.
- **Port already in use**: if `8001` or `5173` is taken, set a different
  `PORT` in `backend/.env` (e.g. `PORT=8001`) and update `FRONTEND_ORIGIN` /
  the frontend's `VITE_API_BASE` accordingly.
- **`psql` not found**: PATH wasn't updated correctly in step 1, or you
  didn't open a new terminal window after editing it.
- **Postgres service not running**: it should auto-start as a Windows
  service (`postgresql-x64-16`). Check via `services.msc` if `psql` can't
  connect, and start it there if stopped.

---

Everything else — the auth flow, task API, React UI — works identically to
the main `README.md`; this file only replaces the "install Postgres / run
the servers" parts with Docker-free, Windows-native steps.
