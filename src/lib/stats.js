// Dashboard numbers, all derived from the user's bookings. Only completed rides count.

import { KG_CO2_PER_TREE_YEAR, LEVELS } from "./config";

export function getLevel(totalKg) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (totalKg >= level.minKg) index = i;
  });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? (totalKg - current.minKg) / (next.minKg - current.minKg) : 1;
  return { current, next, progress: Math.min(1, Math.max(0, progress)) };
}

export function getStats(allBookings, now = new Date()) {
  const bookings = allBookings.filter((b) => b.status === "completed");
  const savedG = bookings.reduce((sum, b) => sum + b.co2SavedG, 0);
  const km = bookings.reduce((sum, b) => sum + b.distanceKm, 0);
  const spent = bookings.reduce((sum, b) => sum + b.fare, 0);
  const baselineG = bookings.reduce((sum, b) => sum + b.baselineG, 0);
  const rideG = bookings.reduce((sum, b) => sum + b.rideG, 0);

  // Last 6 calendar months, oldest first.
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      savedG: 0,
    });
  }
  const monthIndex = Object.fromEntries(months.map((m, i) => [m.key, i]));
  bookings.forEach((b) => {
    const d = new Date(b.createdAt);
    const i = monthIndex[`${d.getFullYear()}-${d.getMonth()}`];
    if (i !== undefined) months[i].savedG += b.co2SavedG;
  });

  const mix = {};
  bookings.forEach((b) => {
    mix[b.vehicleType] = (mix[b.vehicleType] || 0) + 1;
  });

  const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    rides: bookings.length,
    savedG,
    savedKg: savedG / 1000,
    trees: savedG / 1000 / KG_CO2_PER_TREE_YEAR,
    km,
    spent,
    baselineG,
    rideG,
    months,
    mix,
    thisMonth: months[5].savedG,
    lastMonth: months[4].savedG,
    last: sorted[0] || null,
    level: getLevel(savedG / 1000),
  };
}
