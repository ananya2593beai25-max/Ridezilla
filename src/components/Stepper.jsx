// Plus and minus control for a whole number. Works with react-hook-form's Controller.

import Icon from "./Icon";

export default function Stepper({ id, label, value, onChange, min = 1, max = 6 }) {
  return (
    <div className="field">
      <span className="label" id={`${id}-label`}>
        {label}
      </span>
      <div className="stepper" role="group" aria-labelledby={`${id}-label`}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          <Icon name="minus" />
        </button>
        <output id={id} aria-live="polite">
          {value}
        </output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
