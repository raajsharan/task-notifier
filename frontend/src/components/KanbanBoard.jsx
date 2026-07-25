import { useState } from "react";

const STAGES = [
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In-Progress" },
  { key: "on_hold", label: "On-Hold" },
  { key: "completed", label: "Completed" },
];

export default function KanbanBoard({ tasks, onStageChange, onEdit, onDelete }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDrop = (e, stageKey) => {
    e.preventDefault();
    setDragOverStage(null);
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    const task = tasks.find((t) => t.id === taskId);
    if (task && (task.stage || "not_started") !== stageKey) {
      onStageChange(task, stageKey);
    }
    setDraggingId(null);
  };

  return (
    <div className="kanban-board">
      {STAGES.map((stage) => {
        const stageTasks = tasks.filter((t) => (t.stage || "not_started") === stage.key);
        const isDragOver = dragOverStage === stage.key;
        return (
          <div
            className={`kanban-column ${isDragOver ? "drag-over" : ""}`}
            key={stage.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage.key);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.key ? null : s))}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <h3>
              {stage.label} <span className="kanban-count">{stageTasks.length}</span>
            </h3>
            {stageTasks.length === 0 ? (
              <p className="empty">Drop a task here.</p>
            ) : (
              <ul className="kanban-cards">
                {stageTasks.map((task) => (
                  <li
                    className={`kanban-card ${draggingId === task.id ? "dragging" : ""}`}
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(task.id));
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStage(null);
                    }}
                  >
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">Due {task.due_date}</div>
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
