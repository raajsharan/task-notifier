import { useState } from "react";
import * as api from "../api.js";

export default function ForgotPassword({ onSwitchToLogin }) {
  const [step, setStep] = useState("email"); // "email" | "answer" | "done"
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { question } = await api.getSecurityQuestion(email);
      setQuestion(question);
      setStep("answer");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't look up that account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.selfResetPassword(email, answer, newPassword);
      setStep("done");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't reset your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div className="auth-card">
        <h2>Password reset</h2>
        <p>Your password has been reset. You can now log in with your new password.</p>
        <button type="button" className="btn-primary" onClick={onSwitchToLogin}>
          Back to log in
        </button>
      </div>
    );
  }

  if (step === "answer") {
    return (
      <div className="auth-card">
        <h2>Forgot password</h2>
        <form onSubmit={submitAnswer}>
          <div className="field">
            <label htmlFor="forgot-answer">{question}</label>
            <input
              id="forgot-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="forgot-new-password">New password</label>
            <input
              id="forgot-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="forgot-confirm-password">Confirm new password</label>
            <input
              id="forgot-confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
          </button>
        </form>
        <p className="auth-switch">
          <button type="button" className="link-btn" onClick={onSwitchToLogin}>
            Back to log in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h2>Forgot password</h2>
      <form onSubmit={submitEmail}>
        <div className="field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Looking up…" : "Continue"}
        </button>
      </form>
      <p className="auth-switch">
        <button type="button" className="link-btn" onClick={onSwitchToLogin}>
          Back to log in
        </button>
      </p>
    </div>
  );
}
