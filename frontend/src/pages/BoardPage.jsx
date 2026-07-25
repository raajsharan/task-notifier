import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import TaskEditModal from "../components/TaskEditModal.jsx";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function BoardPage() {
  const { tasks, loading, handleCreate, handleToggle, handleDelete, handleSaveEdit } =
    useOutletContext();
  const [editingTask, setEditingTask] = useState(null);

  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.due_date === today);
  const pendingTasks = tasks.filter((t) => t.status === "pending" && t.due_date < today);
  const upcomingTasks = tasks.filter((t) => t.due_date > today);

  return (
    <>
      <TaskForm onCreate={handleCreate} />

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="task-columns">
          <TaskList
            title={`Today (${today})`}
            tasks={todayTasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={setEditingTask}
            emptyText="Nothing due today 🎉"
          />
          <TaskList
            title="Pending / Overdue"
            tasks={pendingTasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={setEditingTask}
            emptyText="No overdue tasks 👍"
          />
          <TaskList
            title="Upcoming"
            tasks={upcomingTasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={setEditingTask}
            emptyText="Nothing scheduled ahead."
          />
        </div>
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}
