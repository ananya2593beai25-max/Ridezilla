import { STATUS } from "../lib/bookingStatus";

/** A coloured label for a booking status. `short` uses the one-word form, good for tables. */
export default function StatusChip({ status, short = false }) {
  const info = STATUS[status] || { label: status, short: status, chip: "" };
  return <span className={`chip ${info.chip}`.trim()}>{short ? info.short : info.label}</span>;
}
