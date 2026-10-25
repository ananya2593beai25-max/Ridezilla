// A simulated driver, for showing live tracking without a server or a real GPS.
//
// It moves like a real vehicle: at the vehicle's average speed, so the time taken is distance divided by speed.
// The position is worked out from the clock and the times already saved on the booking, so nothing new is stored
// and every tab (rider, driver, admin) shows the same spot:
//   assigned    -> the driver starts as far from the pickup as the vehicle covers in its "minutes away" time
//                  (for example 3 minutes at 45 km/h is 2.25 km) and drives to the pickup at that speed
//   in_progress -> the driver follows the road route from pickup to drop-off, taking the booking's travel time
// A real version would send the driver phone's GPS (navigator.geolocation.watchPosition) to a server instead.

import { useEffect, useMemo, useState } from "react";
import { haversineKm } from "./calc";
import { SIMULATION_SPEEDUP } from "./config";

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** The same booking always gives the same starting point: `km` from the pickup, in a direction taken from the id. */
export function approachStart(pickup, bookingId, km) {
  let hash = 0;
  for (const ch of String(bookingId)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const bearing = ((hash % 360) * Math.PI) / 180;
  const dLat = (km / 111.2) * Math.cos(bearing);
  const dLng = (km / (111.2 * Math.cos((pickup.lat * Math.PI) / 180))) * Math.sin(bearing);
  return { lat: pickup.lat + dLat, lng: pickup.lng + dLng };
}

/** The point a given share (0 to 1) of the way along a line of [lng, lat] pairs. */
export function pointAlong(geometry, fraction) {
  if (!geometry?.length) return null;
  if (geometry.length === 1) return { lat: geometry[0][1], lng: geometry[0][0] };
  const pts = geometry.map(([lng, lat]) => ({ lat, lng }));
  const lengths = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = haversineKm(pts[i - 1], pts[i]);
    lengths.push(d);
    total += d;
  }
  if (total === 0) return pts[0];
  let target = clamp01(fraction) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] === 0 ? 0 : Math.min(1, target / lengths[i]);
      return { lat: pts[i].lat + (pts[i + 1].lat - pts[i].lat) * t, lng: pts[i].lng + (pts[i + 1].lng - pts[i].lng) * t };
    }
    target -= lengths[i];
  }
  return pts[pts.length - 1];
}

const lerp = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

/** The vehicle's average speed in km/h. Older bookings did not save it, so it is worked out from the distance and time. */
export const speedOf = (booking) => booking.avgSpeedKmh || (booking.distanceKm && booking.durationMin ? booking.distanceKm / (booking.durationMin / 60) : 40);

/**
 * Where the simulated driver is for a booking, refreshed every second.
 * Returns null when there is nothing to show (no driver yet, or the ride is over).
 * Otherwise { position, start, phase, etaSec } with phase "approach", "arrived" or "ride".
 */
export function useDriverSim(booking, route) {
  const live = Boolean(booking && booking.assignment && ["assigned", "in_progress"].includes(booking.status));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);

  // How far away the driver starts, and how long the drive to the pickup takes at the vehicle's speed
  const approachMin = booking?.etaMin ?? 5;
  const approachKm = live ? (speedOf(booking) * approachMin) / 60 : 0;
  const start = useMemo(() => (live ? approachStart(booking.pickup, booking.id, approachKm) : null), [live, booking?.pickup, booking?.id, approachKm]); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    if (!live) return null;
    if (booking.status === "assigned") {
      const total = (approachMin * 60) / SIMULATION_SPEEDUP; // seconds on the clock
      const since = (now - Date.parse(booking.assignment.assignedAt)) / 1000;
      const progress = clamp01(since / total);
      return {
        position: lerp(start, booking.pickup, progress),
        start,
        phase: progress >= 1 ? "arrived" : "approach",
        etaSec: Math.ceil((1 - progress) * total),
      };
    }
    if (!route?.geometry?.length || !booking.startedAt) return null;
    const total = ((booking.durationMin ?? route.durationMin) * 60) / SIMULATION_SPEEDUP;
    const progress = clamp01((now - Date.parse(booking.startedAt)) / 1000 / total);
    return { position: pointAlong(route.geometry, progress), start, phase: "ride", etaSec: Math.ceil((1 - progress) * total) };
  }, [live, booking, route, now, start]);
}
