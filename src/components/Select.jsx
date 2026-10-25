// A native <select> with our own arrow. The arrow sits inside the right edge with a gap, and turns 180 degrees while the list is open.
// It works with react-hook-form: spread {...register("name")} onto it like a normal select.

import { useState } from "react";

export default function Select({ className = "input", children, ref, onMouseDown, onKeyDown, onChange, onBlur, ...rest }) {
  const [open, setOpen] = useState(false);
  const inline = className.includes("select-inline");

  return (
    <div className={`select${open ? " is-open" : ""}${inline ? " select--inline" : ""}`}>
      <select
        ref={ref}
        className={className}
        {...rest}
        // A native list has no "opened" event, so we follow clicks, keys, choosing and leaving the field.
        onMouseDown={(e) => {
          setOpen((v) => !v);
          onMouseDown?.(e);
        }}
        onKeyDown={(e) => {
          if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) setOpen((v) => (e.key === "Enter" || e.key === " " ? !v : true));
          if (e.key === "Escape") setOpen(false);
          onKeyDown?.(e);
        }}
        onChange={(e) => {
          setOpen(false);
          onChange?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
      >
        {children}
      </select>
      <svg className="select__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
