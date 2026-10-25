import { useEffect, useState } from "react";

/** Returns `value` only after it has stopped changing for `delay` ms. Used to space out search requests. */
export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
