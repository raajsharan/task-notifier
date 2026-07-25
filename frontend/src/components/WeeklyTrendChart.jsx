import { useState } from "react";

// Thin bar chart: one bar per week, single hue (sequential default for a
// magnitude-over-time series), hairline gridlines, hover tooltip per bar.
export default function WeeklyTrendChart({ weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const width = 560;
  const height = 220;
  const padding = { top: 12, right: 12, bottom: 28, left: 32 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  // Round the axis ceiling up to a clean step.
  const axisMax = Math.max(4, Math.ceil(maxCount / 4) * 4);

  const bandW = plotW / weeks.length;
  const barW = Math.min(24, bandW * 0.5);

  const yFor = (count) => padding.top + plotH * (1 - count / axisMax);
  const gridValues = [0, axisMax / 4, axisMax / 2, (axisMax * 3) / 4, axisMax];

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tasks completed per week, last 8 weeks"
        className="viz-svg"
      >
        {gridValues.map((v) => (
          <line
            key={v}
            x1={padding.left}
            x2={width - padding.right}
            y1={yFor(v)}
            y2={yFor(v)}
            className="viz-gridline"
          />
        ))}
        {gridValues.map((v) => (
          <text key={v} x={padding.left - 8} y={yFor(v)} className="viz-axis-label" textAnchor="end" dy="0.32em">
            {v}
          </text>
        ))}

        {weeks.map((w, i) => {
          const x = padding.left + i * bandW + (bandW - barW) / 2;
          const y = yFor(w.count);
          const h = padding.top + plotH - y;
          const isHover = hoverIdx === i;
          return (
            <g key={w.label}>
              {/* transparent hit area, bigger than the visible bar */}
              <rect
                x={padding.left + i * bandW}
                y={padding.top}
                width={bandW}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setHoverIdx(i)}
                onPointerLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                tabIndex={0}
                aria-label={`${w.label}: ${w.count} completed`}
              />
              <rect
                x={x}
                y={h > 0 ? y : padding.top + plotH}
                width={barW}
                height={Math.max(0, h)}
                rx={4}
                className={`viz-bar ${isHover ? "viz-bar-hover" : ""}`}
              />
              <text
                x={padding.left + i * bandW + bandW / 2}
                y={height - padding.bottom + 16}
                className="viz-axis-label"
                textAnchor="middle"
              >
                {w.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div className="viz-tooltip">
          <strong>{weeks[hoverIdx].count}</strong> completed
          <div className="viz-tooltip-sub">{weeks[hoverIdx].range}</div>
        </div>
      )}
    </div>
  );
}
