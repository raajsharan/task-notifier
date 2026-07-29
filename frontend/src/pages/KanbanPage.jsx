import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard.jsx";
import TaskEditModal from "../components/TaskEditModal.jsx";
import TaskFilterBar from "../components/TaskFilterBar.jsx";
import { useTaskFilters } from "../useTaskFilters.js";

export default function KanbanPage() {
  const { tasks, loading, handleStageChange, handleDelete, handleSaveEdit } = useOutletContext();
  const [editingTask, setEditingTask] = useState(null);
  const filters = useTaskFilters(tasks);

  return (
    <>
      <div className="filter-bar-wrap">
        <TaskFilterBar {...filters} />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <KanbanBoard
          tasks={filters.filtered}
          onStageChange={handleStageChange}
          onEdit={setEditingTask}
          onDelete={handleDelete}
        />
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
