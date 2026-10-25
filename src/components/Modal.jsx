// A centred dialog on top of the page. Closes with the X, the dark backdrop, or the Escape key.

import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";

/** Stops the page behind a dialog from scrolling. Several dialogs can be open, so it counts them. */
let scrollLocks = 0;
export function lockScroll() {
  scrollLocks += 1;
  document.body.classList.add("no-scroll");
  return () => {
    scrollLocks -= 1;
    if (scrollLocks <= 0) document.body.classList.remove("no-scroll");
  };
}

export default function Modal({ title, onClose, children }) {
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() => {
    const unlock = lockScroll();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const opener = document.activeElement;
    panel.current?.focus();
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel card" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={panel}>
        <div className="modal__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
