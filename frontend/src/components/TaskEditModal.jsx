import { useState } from "react";

export default function TaskEditModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.due_date);
  const [status, setStatus] = useState(task.status);
  const [stage, setStage] = useState(task.stage || "not_started");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [tagsInput, setTagsInput] = useState((task.tags || []).join(", "));
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave(task.id, {
        title,
        description,
        due_date: dueDate,
        status,
        stage,
        priority,
        tags,
        recurrence,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Task</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="edit-task-title">Title</label>
            <input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="edit-task-description">Description</label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-task-due-date">Due date</label>
            <input
              id="edit-task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="edit-task-status">Status</label>
            <select id="edit-task-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-task-stage">Kanban stage</label>
            <select id="edit-task-stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In-Progress</option>
              <option value="on_hold">On-Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-task-priority">Priority</label>
            <select
              id="edit-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-task-tags">Tags</label>
            <input
              id="edit-task-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Comma-separated, e.g. work, urgent"
            />
          </div>
          <div className="field">
            <label htmlFor="edit-task-recurrence">Repeats</label>
            <select
              id="edit-task-recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="none">Doesn't repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
