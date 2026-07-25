import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import * as api from "../api.js";

export default function ResetPasswordPage() {
  const { user } = useOutletContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user.is_admin) return;
    api
      .adminGetUser(userId)
      .then(setTargetUser)
      .catch((err) => setLoadError(err?.response?.data?.detail || "Couldn't load that user."));
  }, [user.is_admin, userId]);

  if (!user.is_admin) {
    return <p className="auth-error">You don't have admin access.</p>;
  }

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
      await api.adminResetPassword(userId, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't reset the password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-panel reset-password-page">
      <Link className="link-btn" to="/admin">
        ← Back to user accounts
      </Link>
      <h3>Reset password</h3>

      {loadError && <p className="auth-error">{loadError}</p>}

      {targetUser && (
        <>
          <p className="dashboard-note">
            Setting a new password for <strong>{targetUser.email}</strong>
            {targetUser.is_admin ? " (admin)" : ""}.
          </p>

          {success ? (
            <p className="dashboard-note">
              ✅ Password reset. <Link to="/admin">Back to user accounts</Link>
            </p>
          ) : (
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
                <button type="button" className="modal-cancel-btn" onClick={() => navigate("/admin")}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Reset password"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
