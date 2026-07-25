import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import * as api from "../api.js";

export default function AdminPage() {
  const { user } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user.is_admin) return;
    setLoading(true);
    api
      .adminListUsers()
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.detail || "Couldn't load users."))
      .finally(() => setLoading(false));
  }, [user.is_admin]);

  if (!user.is_admin) {
    return <p className="auth-error">You don't have admin access.</p>;
  }

  return (
    <div className="dashboard-panel">
      <h3>User accounts</h3>
      {error && <p className="auth-error">{error}</p>}
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
                  <Link className="link-btn" to={`/admin/reset-password/${u.id}`}>
                    Reset password
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
