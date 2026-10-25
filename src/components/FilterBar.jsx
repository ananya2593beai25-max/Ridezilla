// One filter control, two looks. On a laptop it is a row of chips. On a phone it becomes a dropdown,
// because a row of chips either wraps into many lines or scrolls off the side.
// options: [{ value, label, count? }]

import { useId } from "react";
import Select from "./Select";

export default function FilterBar({ options, value, onChange, label = "Filter" }) {
  const id = useId();
  const text = (o) => (o.count === undefined ? o.label : `${o.label} (${o.count})`);

  return (
    <>
      <div className="filters filter-bar__chips" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" className="filter-chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {text(o)}
          </button>
        ))}
      </div>

      <div className="field filter-bar__select">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {text(o)}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
