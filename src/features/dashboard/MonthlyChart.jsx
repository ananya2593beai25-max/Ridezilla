// Monthly CO2 saved as an SVG area chart, drawn by hand (no chart library) so every line is explainable.

import { useMemo } from "react";

const W = 560;
const H = 220;
const PAD = { l: 38, r: 12, t: 14, b: 28 };

export default function MonthlyChart({ months }) {
  const chart = useMemo(() => {
    const values = months.map((m) => m.savedG / 1000);
    const max = Math.max(1, ...values);
    const top = Math.max(4, Math.ceil((max * 1.15) / 4) * 4); // multiple of 4 so the gridlines read as whole numbers
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const x = (i) => PAD.l + (innerW * i) / (months.length - 1);
    const y = (v) => PAD.t + innerH - (innerH * v) / top;
    const pts = values.map((v, i) => [x(i), y(v)]);

    // Smooth curve: each segment bends through the midpoint between two points.
    let line = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i += 1) {
      const mid = (pts[i - 1][0] + pts[i][0]) / 2;
      line += ` C${mid},${pts[i - 1][1]} ${mid},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`;
    }
    const area = `${line} L${pts.at(-1)[0]},${PAD.t + innerH} L${pts[0][0]},${PAD.t + innerH} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => top * t);
    return { values, pts, line, area, ticks, y, x };
  }, [months]);

  const label = `CO2 saved per month in kilograms: ${months.map((m, i) => `${m.label} ${chart.values[i].toFixed(1)}`).join(", ")}`;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3DDC97" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3DDC97" stopOpacity="0" />
        </linearGradient>
      </defs>

      {chart.ticks.map((t) => (
        <g key={t}>
          <line className="grid-line" x1={PAD.l} x2={W - PAD.r} y1={chart.y(t)} y2={chart.y(t)} />
          <text x={PAD.l - 8} y={chart.y(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}

      {months.map((m, i) => (
        <text key={m.key} x={chart.x(i)} y={H - 6} textAnchor="middle">
          {m.label}
        </text>
      ))}

      <path className="area" d={chart.area} />
      {/* pathLength=1 lets one CSS animation draw the line whatever its real length is. */}
      <path className="line" d={chart.line} pathLength="1" style={{ "--len": 1 }} />
      {chart.pts.map(([cx, cy], i) => (
        <circle key={months[i].key} className="dot" cx={cx} cy={cy} r="4">
          <title>
            {months[i].label}: {chart.values[i].toFixed(2)} kg
          </title>
        </circle>
      ))}
    </svg>
  );
}
