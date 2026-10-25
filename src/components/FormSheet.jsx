// A form that sits on the page on a laptop, and opens as a bottom sheet (a popup from the bottom) on a phone.
// On a phone the page shows a button instead, and `open` decides whether the sheet is showing.
// The CSS does the switching, so the same markup serves both sizes.

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { lockScroll } from "./Modal";

export default function FormSheet({ open, onClose, title, children }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Move the keyboard focus into the form, so a phone user can start typing.
    panel.current?.querySelector("input, select, textarea")?.focus({ preventScroll: true });
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`sheet${open ? " is-open" : ""}`}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel" ref={panel} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label={title}>
        <div className="sheet__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
