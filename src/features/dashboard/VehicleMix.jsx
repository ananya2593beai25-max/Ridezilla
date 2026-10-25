// Donut chart of how many rides were on each vehicle type.

import { useEffect, useState } from "react";

const COLORS = { bike: "#3DDC97", rickshaw: "#38BDF8", car: "#A78BFA" };
const LABELS = { bike: "E-Bike", rickshaw: "E-Rickshaw", car: "Electric Car" };

export default function VehicleMix({ mix }) {
  const entries = Object.entries(mix);
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [total]);

  if (!total) return <p className="muted">No rides yet.</p>;

  let offset = 0;
  const segments = entries.map(([type, count]) => {
    const pct = (count / total) * 100;
    const seg = { type, count, pct, offset };
    offset += pct;
    return seg;
  });

  return (
    <div className="donut-wrap">
      <svg className="donut" viewBox="0 0 132 132" aria-hidden="true" focusable="false">
        <circle cx="66" cy="66" r="52" pathLength="100" style={{ stroke: "var(--border)" }} />
        {segments.map((s) => {
          const length = Math.max(0, s.pct - 1); // 1 unit gap between segments
          return (
            <circle
              key={s.type}
              cx="66"
              cy="66"
              r="52"
              pathLength="100"
              stroke={COLORS[s.type] || "#8A9A9F"}
              strokeDasharray={drawn ? `${length} ${100 - length}` : "0 100"}
              strokeDashoffset={-s.offset}
            />
          );
        })}
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.type}>
            <i style={{ background: COLORS[s.type] || "#8A9A9F" }} />
            {LABELS[s.type] || s.type}: {s.count} ({Math.round(s.pct)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
