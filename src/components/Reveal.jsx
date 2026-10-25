// Fades children in when they scroll into view. The CSS for .reveal only applies when JS is running.

import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", index = 0, className = "", style, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal${visible ? " in-view" : ""} ${className}`.trim()} style={{ "--i": index, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
