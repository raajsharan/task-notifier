export default function TaskFilterBar({
  search,
  setSearch,
  priority,
  setPriority,
  tag,
  setTag,
  allTags,
  hasActiveFilters,
  clear,
}) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks…"
        aria-label="Search tasks"
        className="filter-search"
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
        <option value="all">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filter by tag">
        <option value="all">All tags</option>
        {allTags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {hasActiveFilters && (
        <button type="button" className="link-btn" onClick={clear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
