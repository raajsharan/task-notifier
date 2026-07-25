import axios from "axios";

// An explicitly empty VITE_API_BASE means "same origin" (relative URLs,
// proxied by Nginx) — only fall back to localhost when it's truly unset.
const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : "http://localhost:8001";
const TOKEN_KEY = "task_manager_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Auth ----------

export const register = (email, password) =>
  client.post("/api/auth/register", { email, password }).then((r) => r.data);

export const login = (email, password) => {
  // FastAPI's OAuth2PasswordRequestForm expects form-encoded data with a
  // "username" field (we treat that as the email).
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return client
    .post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((r) => r.data);
};

export const getMe = () => client.get("/api/auth/me").then((r) => r.data);

// ---------- Tasks ----------

export const getTasks = () => client.get("/api/tasks").then((r) => r.data);

export const createTask = (task) => client.post("/api/tasks", task).then((r) => r.data);

export const updateTask = (id, updates) =>
  client.patch(`/api/tasks/${id}`, updates).then((r) => r.data);

export const deleteTask = (id) => client.delete(`/api/tasks/${id}`).then((r) => r.data);

// ---------- Admin ----------

export const adminListUsers = () => client.get("/api/admin/users").then((r) => r.data);

export const adminGetUser = (userId) => client.get(`/api/admin/users/${userId}`).then((r) => r.data);

export const adminResetPassword = (userId, newPassword) =>
  client
    .post(`/api/admin/users/${userId}/reset-password`, { new_password: newPassword })
    .then((r) => r.data);
