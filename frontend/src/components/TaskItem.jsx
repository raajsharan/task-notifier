export default function TaskItem({ task, onToggle, onDelete }) {
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.due_date < new Date().toISOString().slice(0, 10);

  return (
    <li className={`task-item ${isDone ? "done" : ""} ${isOverdue ? "overdue" : ""}`}>
      <label className="task-check">
        <input type="checkbox" checked={isDone} onChange={() => onToggle(task)} />
        <div>
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-desc">{task.description}</div>}
          <div className="task-meta">
            Due {task.due_date} {isOverdue && <span className="badge">Overdue</span>}
          </div>
        </div>
      </label>
      <button className="delete-btn" onClick={() => onDelete(task.id)} aria-label="Delete task">
        ✕
      </button>
    </li>
  );
}
