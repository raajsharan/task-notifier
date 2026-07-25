import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard.jsx";
import TaskEditModal from "../components/TaskEditModal.jsx";

export default function KanbanPage() {
  const { tasks, loading, handleStageChange, handleDelete, handleSaveEdit } = useOutletContext();
  const [editingTask, setEditingTask] = useState(null);

  return (
    <>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <KanbanBoard
          tasks={tasks}
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
