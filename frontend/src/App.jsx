import { useEffect, useState, useCallback } from "react";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import KanbanBoard from "./components/KanbanBoard.jsx";
import TaskEditModal from "./components/TaskEditModal.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import * as api from "./api.js";
import { notifyDailySummary } from "./dailyNotification.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("board"); // "board" | "kanban"
  const [editingTask, setEditingTask] = useState(null);

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
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView("login")}
          />
        )}
      </div>
    );
  }

  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.due_date === today);
  const pendingTasks = tasks.filter((t) => t.status === "pending" && t.due_date < today);
  const upcomingTasks = tasks.filter((t) => t.due_date > today);

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
      </header>

      <main>
        <TaskForm onCreate={handleCreate} />

        <div className="view-tabs">
          <button
            type="button"
            className={`view-tab-btn ${view === "board" ? "active" : ""}`}
            onClick={() => setView("board")}
          >
            Board
          </button>
          <button
            type="button"
            className={`view-tab-btn ${view === "kanban" ? "active" : ""}`}
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : view === "board" ? (
          <div className="task-columns">
            <TaskList
              title={`Today (${today})`}
              tasks={todayTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={setEditingTask}
              emptyText="Nothing due today 🎉"
            />
            <TaskList
              title="Pending / Overdue"
              tasks={pendingTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={setEditingTask}
              emptyText="No overdue tasks 👍"
            />
            <TaskList
              title="Upcoming"
              tasks={upcomingTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={setEditingTask}
              emptyText="Nothing scheduled ahead."
            />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onStageChange={handleStageChange}
            onEdit={setEditingTask}
            onDelete={handleDelete}
          />
        )}
      </main>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
