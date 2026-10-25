// Place search for Punjab, Chandigarh and Panchkula using Nominatim (OpenStreetMap). No API key needed.

import { API, REGION, COUNTRY_CODE, ALLOWED_STATES, ALLOWED_ISO_CODES, ALLOWED_HARYANA_DISTRICTS } from "../../lib/config";
import { getJSON, cached } from "../../lib/http";

/** True when a Nominatim address is in Punjab, Chandigarh, or the Panchkula district of Haryana. The bounding box alone also covers nearby states and Pakistan. */
export function isServed(address = {}) {
  if (String(address.country_code || "").toLowerCase() !== COUNTRY_CODE) return false;
  const iso = address["ISO3166-2-lvl4"];
  if (ALLOWED_ISO_CODES.includes(iso) || ALLOWED_STATES.includes(address.state)) return true;
  if (iso !== "IN-HR" && address.state !== "Haryana") return false;
  const where = [address.state_district, address.county, address.city, address.town, address.village, address.suburb]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return ALLOWED_HARYANA_DISTRICTS.some((d) => where.includes(d.toLowerCase()));
}

/** A quick check on coordinates only. Used to skip lookups for points far outside the served area. */
export function inRegion(lat, lng) {
  const [[south, west], [north, east]] = REGION.bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function toPlace(result) {
  const parts = (result.display_name || "").split(",").map((p) => p.trim());
  return {
    name: result.name || parts[0] || "Unnamed place",
    label: parts.slice(1, 4).join(", "),
    lat: Number(result.lat),
    lng: Number(result.lon),
  };
}

/** Free-text search inside the served area. Pass an AbortSignal to cancel a stale request. */
export async function searchPlaces(query, { signal } = {}) {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: "10",
    countrycodes: COUNTRY_CODE,
    viewbox: REGION.viewbox,
    bounded: "1",
  });
  const data = await cached(`ridezilla.geo.pb.${q.toLowerCase()}`, () =>
    getJSON(`${API.nominatim}/search?${params}`, { signal })
  );
  return data.filter((r) => isServed(r.address)).map(toPlace).slice(0, 6);
}

/** Turn a map click or GPS position into a named place. Returns null outside the served area. */
export async function reverseGeocode(lat, lng) {
  if (!inRegion(lat, lng)) return null;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "17",
  });
  const data = await cached(`ridezilla.rev.${lat.toFixed(4)},${lng.toFixed(4)}`, () =>
    getJSON(`${API.nominatim}/reverse?${params}`)
  );
  if (!data || data.error || !isServed(data.address)) return null;
  const place = toPlace(data);
  // Use the click position, not the snapped building position, so the pin stays where the user put it.
  return { ...place, lat, lng };
}
