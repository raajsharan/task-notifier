import { useMemo, useState } from "react";

// Shared search/priority/tag filtering, used identically by Board and
// Kanban so the two views stay in sync on how filtering behaves.
export function useTaskFilters(tasks) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [tag, setTag] = useState("all");

  const allTags = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => (t.tags || []).forEach((tg) => set.add(tg)));
    return [...set].sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q) {
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = (t.description || "").toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      if (priority !== "all" && t.priority !== priority) return false;
      if (tag !== "all" && !(t.tags || []).includes(tag)) return false;
      return true;
    });
  }, [tasks, search, priority, tag]);

  const hasActiveFilters = search.trim() !== "" || priority !== "all" || tag !== "all";

  const clear = () => {
    setSearch("");
    setPriority("all");
    setTag("all");
  };

  return {
    filtered,
    search,
    setSearch,
    priority,
    setPriority,
    tag,
    setTag,
    allTags,
    hasActiveFilters,
    clear,
  };
}
