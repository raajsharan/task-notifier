// Part-to-whole as a single segmented bar (preferred over a donut) +
// legend with counts. Segments with 0 value are omitted from the bar
// but still listed in the legend so the total always reconciles.
export default function StackedBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="stacked-bar-wrap">
      <div className="stacked-bar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {total === 0 ? (
          <div className="stacked-bar-empty" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                className="stacked-bar-segment"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                title={`${s.label}: ${s.value}`}
              />
            ))
        )}
      </div>
      <ul className="stacked-bar-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.label} <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
