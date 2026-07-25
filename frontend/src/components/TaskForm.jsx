import { useState } from "react";

export default function TaskForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title, description, due_date: dueDate, status: "pending" });
    setTitle("");
    setDescription("");
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <h2>Add Task</h2>
      <div className="field">
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prepare client deck"
          required
        />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          rows={2}
        />
      </div>
      <div className="field">
        <label>Due date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
}
