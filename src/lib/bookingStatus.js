// The life of a booking:
//   requested -> assigned -> in_progress -> completed
//   requested or assigned -> cancelled (client or admin), rejected (admin)

export const ACTIVE_STATUSES = ["requested", "assigned", "in_progress"];

export const STATUS = {
  requested: { label: "Waiting for assignment", short: "Requested", chip: "chip--warn" },
  assigned: { label: "Driver assigned", short: "Assigned", chip: "chip--green" },
  in_progress: { label: "On the way", short: "In progress", chip: "chip--green" },
  completed: { label: "Completed", short: "Completed", chip: "chip--green" },
  cancelled: { label: "Cancelled", short: "Cancelled", chip: "chip--red" },
  rejected: { label: "Rejected", short: "Rejected", chip: "chip--red" },
};

export const isActive = (booking) => ACTIVE_STATUSES.includes(booking.status);

/** Groups the six statuses into the three views used by the client: active, completed, cancelled. */
export function bookingPhase(booking) {
  if (isActive(booking)) return "active";
  if (booking.status === "completed") return "completed";
  return "cancelled";
}

export const bookingTime = (booking) => new Date(`${booking.date}T${booking.time}`);

/** "Today, 13:00", "Tomorrow, 09:30" or "24 Oct, 18:00". */
export function whenLabel(booking, now = new Date()) {
  const date = bookingTime(booking);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const day = same(date, now) ? "Today" : same(date, tomorrow) ? "Tomorrow" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${day}, ${booking.time}`;
}
