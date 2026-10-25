// Road distance and route line from the public OSRM server, with an estimated fallback.

import { API, ROAD_FACTOR, FALLBACK_SPEED_KMH } from "../../lib/config";
import { getJSON, cached } from "../../lib/http";
import { haversineKm } from "../../lib/calc";

const coord = (p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`;

async function fetchRoute(from, to, signal) {
  const url = `${API.osrm}/${coord(from)};${coord(to)}?overview=full&geometries=geojson`;
  const data = await getJSON(url, { signal });
  if (data.code !== "Ok" || !data.routes?.length) {
    throw { type: "empty", message: "No road route was found between these places." };
  }
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry.coordinates, // [lng, lat] pairs
    estimated: false,
  };
}

function estimateRoute(from, to) {
  const distanceKm = haversineKm(from, to) * ROAD_FACTOR;
  return {
    distanceKm,
    durationMin: (distanceKm / FALLBACK_SPEED_KMH) * 60,
    geometry: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    estimated: true,
  };
}

/** Always resolves. If OSRM fails twice, returns a straight-line estimate with estimated: true. */
export async function getRoute(from, to, { signal } = {}) {
  const key = `ridezilla.route.${coord(from)}.${coord(to)}`;
  try {
    return await cached(key, async () => {
      try {
        return await fetchRoute(from, to, signal);
      } catch (error) {
        if (error.type === "empty" || error.type === "aborted") throw error;
        return fetchRoute(from, to, signal); // one retry
      }
    });
  } catch (error) {
    if (error.type === "aborted") throw error;
    return estimateRoute(from, to);
  }
}
