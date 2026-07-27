import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const STAGES = [
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In-Progress" },
  { key: "on_hold", label: "On-Hold" },
  { key: "completed", label: "Completed" },
];

function KanbanCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 10, position: "relative" }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? "dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <div className="task-title">
        {task.title} <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
      </div>
      {task.description && <div className="task-desc">{task.description}</div>}
      <div className="task-meta">
        Due {task.due_date}
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
      <div className="kanban-card-footer">
        {/* Drag listeners are on the whole card; the small movement threshold
            on the sensor (below) lets a plain tap/click still reach these
            buttons instead of being swallowed by drag activation. */}
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
  );
}

function KanbanColumn({ stage, tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? "drag-over" : ""}`}>
      <h3>
        {stage.label} <span className="kanban-count">{tasks.length}</span>
      </h3>
      {tasks.length === 0 ? (
        <p className="empty">Drop a task here.</p>
      ) : (
        <ul className="kanban-cards">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function KanbanBoard({ tasks, onStageChange, onEdit, onDelete }) {
  // A small movement threshold before a drag "activates" — this is what
  // keeps a plain tap/click on Edit/Delete working instead of every touch
  // being captured as a drag gesture. Same sensor handles mouse and touch.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStage = over.id;
    if (task && (task.stage || "not_started") !== newStage) {
      onStageChange(task, newStage);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {STAGES.map((stage) => {
          const stageTasks = tasks.filter((t) => (t.stage || "not_started") === stage.key);
          return (
            <KanbanColumn
              key={stage.key}
              stage={stage}
              tasks={stageTasks}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
