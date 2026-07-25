import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../api.js";

function ResetPasswordModal({ targetUser, onClose, onReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onReset(targetUser.id, newPassword);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't reset the password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reset password</h2>
        <p className="dashboard-note">
          Setting a new password for <strong>{targetUser.email}</strong>.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.adminListUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.is_admin) refresh();
  }, [user.is_admin]);

  if (!user.is_admin) {
    return <p className="auth-error">You don't have admin access.</p>;
  }

  const handleReset = async (userId, newPassword) => {
    await api.adminResetPassword(userId, newPassword);
    setSuccessMsg(`Password reset for user #${userId}.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="dashboard-panel">
      <h3>User accounts</h3>
      {error && <p className="auth-error">{error}</p>}
      {successMsg && <p className="dashboard-note">{successMsg}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Created</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.created_at.slice(0, 10)}</td>
                <td>{u.is_admin ? "Admin" : "User"}</td>
                <td>
                  <button type="button" className="link-btn" onClick={() => setResetTarget(u)}>
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetUser={resetTarget}
          onClose={() => setResetTarget(null)}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
