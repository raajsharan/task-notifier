const STAGES = [
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In-Progress" },
  { key: "on_hold", label: "On-Hold" },
  { key: "completed", label: "Completed" },
];

export default function KanbanBoard({ tasks, onStageChange, onEdit, onDelete }) {
  return (
    <div className="kanban-board">
      {STAGES.map((stage, i) => {
        const stageTasks = tasks.filter((t) => (t.stage || "not_started") === stage.key);
        return (
          <div className="kanban-column" key={stage.key}>
            <h3>
              {stage.label} <span className="kanban-count">{stageTasks.length}</span>
            </h3>
            {stageTasks.length === 0 ? (
              <p className="empty">Nothing here.</p>
            ) : (
              <ul className="kanban-cards">
                {stageTasks.map((task) => (
                  <li className="kanban-card" key={task.id}>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">Due {task.due_date}</div>
                    <div className="kanban-card-actions">
                      {i > 0 && (
                        <button
                          type="button"
                          className="kanban-move-btn"
                          onClick={() => onStageChange(task, STAGES[i - 1].key)}
                          aria-label={`Move to ${STAGES[i - 1].label}`}
                        >
                          ← {STAGES[i - 1].label}
                        </button>
                      )}
                      {i < STAGES.length - 1 && (
                        <button
                          type="button"
                          className="kanban-move-btn"
                          onClick={() => onStageChange(task, STAGES[i + 1].key)}
                          aria-label={`Move to ${STAGES[i + 1].label}`}
                        >
                          {STAGES[i + 1].label} →
                        </button>
                      )}
                    </div>
                    <div className="kanban-card-footer">
                      <button type="button" className="link-btn" onClick={() => onEdit(task)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => onDelete(task.id)}
                        aria-label="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
