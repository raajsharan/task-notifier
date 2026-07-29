import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import TaskEditModal from "../components/TaskEditModal.jsx";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Local calendar date, not toISOString() (which shifts the date near
// midnight in timezones behind UTC).
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, inMonth: date.getMonth() === month };
  });
}

export default function CalendarPage() {
  const { tasks, loading, handleSaveEdit } = useOutletContext();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editingTask, setEditingTask] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = fmtDate(new Date());
  const grid = buildMonthGrid(year, month);

  const tasksByDate = tasks.reduce((map, t) => {
    (map[t.due_date] ||= []).push(t);
    return map;
  }, {});

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <button type="button" className="link-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ← Previous
        </button>
        <h2>{monthLabel}</h2>
        <button type="button" className="link-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          Next →
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map(({ date, inMonth }) => {
          const key = fmtDate(date);
          const dayTasks = tasksByDate[key] || [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`calendar-cell ${inMonth ? "" : "outside-month"} ${isToday ? "is-today" : ""}`}
            >
              <div className="calendar-cell-date">{date.getDate()}</div>
              <div className="calendar-cell-tasks">
                {dayTasks.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`calendar-task-chip priority-${t.priority} ${t.status === "done" ? "done" : ""}`}
                    onClick={() => setEditingTask(t)}
                    title={t.title}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
