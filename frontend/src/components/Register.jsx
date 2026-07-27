import { useState } from "react";

export default function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setError("A security question and answer are required — they're used to reset your password if you forget it.");
      return;
    }
    setSubmitting(true);
    try {
      await onRegister(email, password, securityQuestion, securityAnswer);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (!err?.response) {
        setError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setError(`Registration failed (server returned ${err.response.status}). Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Create an account</h2>
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
            minLength={8}
          />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Security question</label>
          <input
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            placeholder="e.g. What was your first pet's name?"
            required
          />
        </div>
        <div className="field">
          <label>Answer</label>
          <input
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Used to reset your password if you forget it"
            required
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="link-btn" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}
