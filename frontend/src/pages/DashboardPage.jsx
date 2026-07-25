import { useOutletContext } from "react-router-dom";
import WeeklyTrendChart from "../components/WeeklyTrendChart.jsx";
import StackedBar from "../components/StackedBar.jsx";

// Monday-start week containing `date`.
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Local calendar date, not toISOString() (which would shift the date near
// midnight in timezones behind UTC).
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const STAGE_LABELS = {
  not_started: "Not Started",
  in_progress: "In-Progress",
  on_hold: "On-Hold",
  completed: "Completed",
};

// Ordinal single-hue ramp (blue, light -> dark) — the four stages are a
// left-to-right progression on the Kanban board, not unrelated categories.
const STAGE_COLORS = {
  not_started: "#86b6ef",
  in_progress: "#3987e5",
  on_hold: "#256abf",
  completed: "#104281",
};

export default function DashboardPage() {
  const { tasks, loading } = useOutletContext();

  if (loading) {
    return <p>Loading…</p>;
  }

  const now = new Date();
  const thisWeekStart = startOfWeek(now);

  // Last 8 Monday-start weeks, oldest first.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(thisWeekStart, (i - 7) * 7);
    const end = addDays(start, 7);
    const count = tasks.filter((t) => {
      if (t.status !== "done") return false;
      const completedAt = new Date(t.updated_at);
      return completedAt >= start && completedAt < end;
    }).length;
    return {
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      range: `${fmtDate(start)} – ${fmtDate(addDays(end, -1))}`,
      count,
    };
  });

  const completedThisWeek = weeks[weeks.length - 1].count;
  const totalCompleted = tasks.filter((t) => t.status === "done").length;
  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const totalTasks = tasks.length;

  const stageCounts = Object.keys(STAGE_LABELS).map((key) => ({
    label: STAGE_LABELS[key],
    value: tasks.filter((t) => (t.stage || "not_started") === key).length,
    color: STAGE_COLORS[key],
  }));

  return (
    <div className="dashboard">
      <div className="stat-cards">
        <div className="stat-card-solid" style={{ background: "#2a78d6" }}>
          <div className="stat-solid-icon">✅</div>
          <div>
            <div className="stat-solid-value">{completedThisWeek}</div>
            <div className="stat-solid-label">Completed this week</div>
          </div>
        </div>
        <div className="stat-card-solid" style={{ background: "#1baf7a" }}>
          <div className="stat-solid-icon">🏁</div>
          <div>
            <div className="stat-solid-value">{totalCompleted}</div>
            <div className="stat-solid-label">Completed all-time</div>
          </div>
        </div>
        <div className="stat-card-solid" style={{ background: "#eb6834" }}>
          <div className="stat-solid-icon">🕒</div>
          <div>
            <div className="stat-solid-value">{totalPending}</div>
            <div className="stat-solid-label">Pending tasks</div>
          </div>
        </div>
        <div className="stat-card-solid" style={{ background: "#4a3aa7" }}>
          <div className="stat-solid-icon">📋</div>
          <div>
            <div className="stat-solid-value">{totalTasks}</div>
            <div className="stat-solid-label">Total tasks</div>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <h3>Tasks completed — last 8 weeks</h3>
          <WeeklyTrendChart weeks={weeks} />
        </div>

        <div className="dashboard-panel">
          <h3>Status breakdown</h3>
          <StackedBar
            segments={[
              { label: "Done", value: totalCompleted, color: "#0ca30c" },
              { label: "Pending", value: totalPending, color: "#c3c2b7" },
            ]}
          />
        </div>
      </div>

      <div className="dashboard-panel">
        <h3>Kanban stage breakdown</h3>
        <StackedBar segments={stageCounts} />
      </div>

      <p className="dashboard-note">
        "Completed" counts tasks marked Done on the Board, grouped by the week their status was
        last updated.
      </p>
    </div>
  );
}
