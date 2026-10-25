// Display helpers. Non-breaking spaces keep numbers and units together.

export const formatCO2 = (grams) => (grams < 1000 ? `${Math.round(grams)} g` : `${(grams / 1000).toFixed(1)} kg`);

export const formatRupees = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

export function formatDuration(minutes) {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** A measured time in seconds, such as the time a driver took for the journey: "48 sec", "12 min 5 sec", "1 h 4 min". */
export function formatJourney(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} min ${s % 60} sec` : `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export const formatKm = (km) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
