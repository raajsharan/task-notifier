export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.due_date < new Date().toISOString().slice(0, 10);

  return (
    <li className={`task-item ${isDone ? "done" : ""} ${isOverdue ? "overdue" : ""}`}>
      <label className="task-check">
        <input type="checkbox" checked={isDone} onChange={() => onToggle(task)} />
        <div>
          <div className="task-title">
            {task.title} <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
          </div>
          {task.description && <div className="task-desc">{task.description}</div>}
          <div className="task-meta">
            Due {task.due_date} {isOverdue && <span className="badge">Overdue</span>}
            {task.recurrence && task.recurrence !== "none" && (
              <span className="recurrence-badge" title={`Repeats ${task.recurrence}`}>
                🔁 {task.recurrence}
              </span>
            )}
          </div>
          {task.tags?.length > 0 && (
            <div className="task-tags">
              {task.tags.map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </label>
      <div className="task-item-actions">
        <button type="button" className="link-btn" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="delete-btn" onClick={() => onDelete(task.id)} aria-label="Delete task">
          ✕
        </button>
      </div>
    </li>
  );
}
