import TaskItem from "./TaskItem.jsx";

export default function TaskList({ title, tasks, onToggle, onDelete, onEdit, emptyText }) {
  return (
    <div className="task-list">
      <h3>{title}</h3>
      {tasks.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </ul>
      )}
    </div>
  );
}
