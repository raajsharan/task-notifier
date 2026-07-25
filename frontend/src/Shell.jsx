import { useEffect, useState, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import * as api from "./api.js";
import { notifyDailySummary } from "./dailyNotification.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Shell() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // On load, if a token is already stored, verify it and fetch the user.
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    api
      .getMe()
      .then((me) => setUser(me))
      .catch(() => api.clearToken())
      .finally(() => setCheckingAuth(false));
  }, []);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refreshTasks();
  }, [user, refreshTasks]);

  useEffect(() => {
    if (!user || loading) return;
    const today = todayStr();
    const todayTasks = tasks.filter((t) => t.due_date === today);
    notifyDailySummary(todayTasks, today);
  }, [user, loading, tasks]);

  const handleLogin = async (email, password) => {
    const { access_token } = await api.login(email, password);
    api.setToken(access_token);
    const me = await api.getMe();
    setUser(me);
  };

  const handleRegister = async (email, password) => {
    await api.register(email, password);
    await handleLogin(email, password);
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setTasks([]);
  };

  const handleCreate = async (task) => {
    await api.createTask(task);
    await refreshTasks();
  };

  const handleToggle = async (task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    await api.updateTask(task.id, { status: newStatus });
    await refreshTasks();
  };

  const handleDelete = async (id) => {
    await api.deleteTask(id);
    await refreshTasks();
  };

  const handleStageChange = async (task, newStage) => {
    await api.updateTask(task.id, { stage: newStage });
    await refreshTasks();
  };

  const handleSaveEdit = async (id, updates) => {
    await api.updateTask(id, updates);
    await refreshTasks();
  };

  if (checkingAuth) {
    return (
      <div className="app auth-loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app auth-screen">
        <header>
          <h1>📋 Task Manager</h1>
          <p className="subtitle">Log in to manage your tasks.</p>
        </header>
        {authView === "login" ? (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView("register")} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <div>
            <h1>📋 Task Manager</h1>
            <p className="subtitle">Signed in as {user.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <nav className="page-nav">
          <NavLink to="/" end className={({ isActive }) => `page-nav-link ${isActive ? "active" : ""}`}>
            Board
          </NavLink>
          <NavLink to="/kanban" className={({ isActive }) => `page-nav-link ${isActive ? "active" : ""}`}>
            Kanban
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `page-nav-link ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
        </nav>
      </header>

      <main>
        <Outlet
          context={{
            tasks,
            loading,
            handleCreate,
            handleToggle,
            handleDelete,
            handleStageChange,
            handleSaveEdit,
          }}
        />
      </main>
    </div>
  );
}
