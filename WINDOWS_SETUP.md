# Windows 11 Setup (no Docker)

This walks through running everything natively on Windows 11: PostgreSQL,
the FastAPI backend, and the React frontend. Commands are given for both
**PowerShell** (default Windows Terminal) and note where CMD differs.

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

## 3. Install Python and Node.js

- **Python 3.11+**: https://www.python.org/downloads/windows/
  During install, check **"Add python.exe to PATH"**.
- **Node.js LTS**: https://nodejs.org/en/download

Verify both in a new PowerShell window:
```powershell
python --version
node --version
npm --version
```

## 4. Backend setup

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
```

> If PowerShell blocks the activation script with an execution-policy error,
> run this once (in an admin PowerShell) and try again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Using **CMD** instead of PowerShell avoids this entirely — activate with
> `venv\Scripts\activate.bat`.

Install dependencies:
```powershell
pip install -r requirements.txt
copy .env.example .env
```

Open `.env` in Notepad (or any editor) and fill in a real JWT secret:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```
```
DATABASE_URL=postgresql+psycopg2://taskuser:taskpass@localhost:5432/tasknotifier
JWT_SECRET_KEY=<paste the generated value here>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_ORIGIN=http://localhost:5173
```

Run the backend:
```powershell
uvicorn app.main:app --reload --port 8000
```

Leave this PowerShell window open — it's your running server. On first run,
SQLAlchemy auto-creates the `users` and `tasks` tables in Postgres.

Verify it's up by opening in a browser: http://localhost:8000/api/health
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

- **Windows Firewall prompt**: the first time `python.exe` or `node.exe`
  binds to a port, Windows may show a firewall prompt — allow it on
  "Private networks" at minimum.
- **Port already in use**: if `8000` or `5173` is taken, run with a
  different port, e.g. `uvicorn app.main:app --reload --port 8001` and update
  `FRONTEND_ORIGIN` in `.env` / the frontend's `VITE_API_BASE` accordingly.
- **`psql` not found**: PATH wasn't updated correctly in step 1, or you
  didn't open a new terminal window after editing it.
- **Postgres service not running**: it should auto-start as a Windows
  service (`postgresql-x64-16`). Check via `services.msc` if `psql` can't
  connect, and start it there if stopped.

---

Everything else — the auth flow, task API, React UI — works identically to
the main `README.md`; this file only replaces the "install Postgres / run
the servers" parts with Docker-free, Windows-native steps.
