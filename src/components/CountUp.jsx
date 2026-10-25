// Counts a number up from 0 the first time it scrolls into view. Shows the final value at once for reduced motion.

import { useEffect, useRef, useState } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CountUp({ value, decimals = 0, duration = 1200, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(reduced() ? value : 0);

  useEffect(() => {
    if (reduced() || value === 0) {
      setShown(value);
      return;
    }
    let frame;
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(value * (1 - Math.pow(1 - t, 4)));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  const text = shown.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
