// Progress ring toward the next eco level, with the badges earned so far.

import { useEffect, useState } from "react";
import { LEVELS } from "../../lib/config";

export default function LevelRing({ level, totalKg }) {
  const [animate, setAnimate] = useState(false);

  // Start at 0 and fill on the next frame so the CSS transition has something to animate from.
  useEffect(() => {
    setAnimate(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [level.progress]);

  return (
    <div className="ring-wrap">
      <div className={`ring${animate ? " is-in" : ""}`} style={{ "--p": level.progress }}>
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle className="ring__track" cx="50" cy="50" r="45" pathLength="100" />
          <circle className="ring__value" cx="50" cy="50" r="45" pathLength="100" />
        </svg>
        <div className="ring__label">
          <strong className="num">{Math.round(level.progress * 100)}%</strong>
          <span>to {level.next ? level.next.name : "the top"}</span>
        </div>
      </div>

      <div>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem" }}>{level.current.name}</strong>
        <p className="muted" style={{ fontSize: "0.88rem", marginTop: 4 }}>
          {level.next ? `${(level.next.minKg - totalKg).toFixed(1)} kg more to reach ${level.next.name}.` : "You reached the highest level."}
        </p>
      </div>

      <ol className="level-ladder" aria-label="Eco levels">
        {LEVELS.map((l) => {
          const earned = totalKg >= l.minKg && (l.minKg > 0 || totalKg > 0);
          const here = l.name === level.current.name;
          return (
            <li key={l.name} className={`level-ladder__step${earned ? " is-earned" : ""}${here ? " is-current" : ""}`}>
              <span className="level-ladder__mark" aria-hidden="true">
                {earned ? "✓" : ""}
              </span>
              <span className="level-ladder__name">{l.name}</span>
              <span className="level-ladder__kg">{l.minKg === 0 ? "Start" : `${l.minKg} kg`}</span>
            </li>
          );
        })}
      </ol>
      <p className="muted level-ladder__note">Your level grows with the CO₂ you save: each ride adds to the total, and the ring shows how close you are to the next level.</p>
    </div>
  );
}
