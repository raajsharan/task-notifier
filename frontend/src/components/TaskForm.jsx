import { useState } from "react";

export default function TaskForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onCreate({
      title,
      description,
      due_date: dueDate,
      status: "pending",
      priority,
      tags,
      recurrence,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setTagsInput("");
    setRecurrence("none");
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <h2>Add Task</h2>
      <div className="field">
        <label htmlFor="new-task-title">Title</label>
        <input
          id="new-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prepare client deck"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="new-task-description">Description</label>
        <textarea
          id="new-task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          rows={2}
        />
      </div>
      <div className="field">
        <label htmlFor="new-task-due-date">Due date</label>
        <input
          id="new-task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="new-task-priority">Priority</label>
        <select id="new-task-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="new-task-tags">Tags</label>
        <input
          id="new-task-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Comma-separated, e.g. work, urgent"
        />
      </div>
      <div className="field">
        <label htmlFor="new-task-recurrence">Repeats</label>
        <select
          id="new-task-recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          <option value="none">Doesn't repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
}
