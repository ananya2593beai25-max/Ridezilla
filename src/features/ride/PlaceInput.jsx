// Type-ahead place search powered by Nominatim. The user types a place in Punjab, Chandigarh or Panchkula.
// `value` is the chosen place (or null); the text box can differ from it while the user is still typing.

import { useEffect, useId, useRef, useState } from "react";
import Icon from "../../components/Icon";
import { useDebounce } from "../../hooks/useDebounce";
import { SEARCH_DEBOUNCE_MS } from "../../lib/config";
import { searchPlaces } from "./geocode";

export default function PlaceInput({ label, value, onSelect, onClear, placeholder, error, variant = "pickup", children, name }) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;

  const [text, setText] = useState(value?.name ?? "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [active, setActive] = useState(-1);
  const typing = useRef(false);

  const query = useDebounce(text.trim(), SEARCH_DEBOUNCE_MS);

  // Keep the text box in step when the place changes from outside (map click, swap, locate button).
  useEffect(() => {
    if (value) {
      setText(value.name);
      typing.current = false;
    } else if (!typing.current) {
      setText("");
    }
  }, [value]);

  // Search after the user pauses. Aborting the previous request stops a slow answer overwriting a newer one.
  useEffect(() => {
    if (!typing.current || query.length < 3) return;
    const controller = new AbortController();
    setStatus("loading");
    searchPlaces(query, { signal: controller.signal })
      .then((places) => {
        setResults(places);
        setStatus("done");
        setActive(-1);
      })
      .catch((err) => {
        if (err.type === "aborted") return;
        setResults([]);
        setStatus("error");
      });
    return () => controller.abort("superseded");
  }, [query]);

  const choose = (place) => {
    typing.current = false;
    setText(place.name);
    setOpen(false);
    onSelect(place);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    typing.current = true;
    setText(next);
    setOpen(true);
    if (value) onClear?.();
    if (next.trim().length < 3) {
      setResults([]);
      setStatus("idle");
    }
  };

  const handleKeyDown = (event) => {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const note =
    text.trim().length < 3
      ? "Type at least 3 letters."
      : status === "loading"
        ? "Searching…"
        : status === "error"
          ? "Search is unavailable right now. Try again, or click the map."
          : status === "done" && !results.length
            ? "No place found in Punjab, Chandigarh or Panchkula."
            : "";

  return (
    <div className="field place-field">
      <label htmlFor={inputId}>{label}</label>
      {/* The badge, input, buttons and list sit in one box, so they line up with the input whatever sits above or below it. */}
      <div className="place-field__box">
      <span className={`place-field__badge place-field__badge--${variant}`} aria-hidden="true">
        {variant === "pickup" ? "A" : "B"}
      </span>
      <input
        id={inputId}
        name={name}
        className="input"
        type="text"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => text.trim().length >= 3 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {children}
      {open && (
        <ul id={listId} className="suggestions" role="listbox">
          {results.map((place, i) => (
            <li
              key={`${place.lat}-${place.lng}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`suggestion${i === active ? " is-active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so blur does not close the list before the click lands
                choose(place);
              }}
            >
              <span className="suggestion__icon">
                <Icon name="pin" />
              </span>
              <span className="suggestion__text">
                <span className="suggestion__name">{place.name}</span>
                {place.label && <span className="suggestion__label">{place.label}</span>}
              </span>
            </li>
          ))}
          {note && <li className="suggestion-note" role="presentation">{note}</li>}
        </ul>
      )}
      </div>
      <p id={`${inputId}-error`} className="field-error" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
