const STORAGE_KEY = "task_manager_last_notified_date";

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1174.66, 1567.98]; // A5, D6, G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Web Audio unavailable; skip the sound.
  }
}

function showNotification(todayTasks) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const count = todayTasks.length;
  const body =
    count === 0
      ? "Nothing due today. 🎉"
      : todayTasks
          .slice(0, 5)
          .map((t) => `• ${t.title}`)
          .join("\n") + (count > 5 ? `\n…and ${count - 5} more` : "");

  new Notification(count === 0 ? "Task Manager: Nothing due today" : `Task Manager: ${count} task${count === 1 ? "" : "s"} due today`, {
    body,
    tag: "task-manager-daily-summary",
  });
}

// Requests permission and, once per calendar day, plays a sound and shows a
// system notification listing the tasks due today.
export async function notifyDailySummary(todayTasks, todayStr) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;

  const lastNotified = localStorage.getItem(STORAGE_KEY);
  if (lastNotified === todayStr) return;

  playChime();
  showNotification(todayTasks);
  localStorage.setItem(STORAGE_KEY, todayStr);
}
