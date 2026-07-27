import { useState } from "react";

export default function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      if (typeof err?.response?.data?.detail === "string") {
        setError(err.response.data.detail);
      } else if (!err?.response) {
        setError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setError("Login failed. Check your email and password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Log in</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        <button type="button" className="link-btn" onClick={onSwitchToForgotPassword}>
          Forgot password?
        </button>
      </p>
      <p className="auth-switch">
        No account yet?{" "}
        <button type="button" className="link-btn" onClick={onSwitchToRegister}>
          Register
        </button>
      </p>
    </div>
  );
}
