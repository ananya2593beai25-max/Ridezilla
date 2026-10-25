// One map component used everywhere: dark OSM tiles, locked to the served area, with pins and the route line.
// Pass onMapClick to let users drop a pin by clicking.

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { API, REGION } from "../../lib/config";
import { inRegion } from "./geocode";

// A map pin with a letter: A for pickup, B for drop-off. The point of the pin sits on the place.
const pinIcon = (kind, letter) =>
  L.divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin map-pin--${kind}" aria-hidden="true"><i>${letter}</i></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 38], // the pin's point: centre of the box, plus half the rotated diagonal
  });
// The (simulated) driver: a green car dot. Its position changes once a second and CSS slides it between the points.
const driverIcon = L.divIcon({
  className: "driver-marker",
  html: '<span class="driver-dot" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16l1.5-5a2 2 0 012-1.4h7a2 2 0 012 1.4l1.5 5v3h-14z"/><circle cx="8" cy="19" r="0.6"/><circle cx="16" cy="19" r="0.6"/></svg></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
const ICONS = { pickup: pinIcon("pickup", "A"), drop: pinIcon("drop", "B"), driver: driverIcon };

/** Move the camera to fit the pins and route whenever they change. */
function FitView({ pickup, dropoff, route, extra }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      // Re-measure the box first. If the map's size changed after it was drawn, fitting to the old size leaves it too far out.
      map.invalidateSize();
      if (route?.geometry?.length) {
        map.fitBounds(
          [...route.geometry.map(([lng, lat]) => [lat, lng]), ...(extra ? [[extra.lat, extra.lng]] : [])],
          { padding: [36, 36], maxZoom: 16 }
        );
      } else if (pickup && dropoff) {
        map.fitBounds(
          [
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ],
          { padding: [44, 44], maxZoom: 16 }
        );
      } else if (pickup || dropoff) {
        const p = pickup || dropoff;
        map.setView([p.lat, p.lng], 14);
      }
    };

    const frame = requestAnimationFrame(fit);
    // Fit again whenever the map's box changes size, for example when a phone's layout settles or the screen turns.
    const observer = new ResizeObserver(() => fit());
    observer.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map, pickup, dropoff, route, extra]);
  return null;
}

export const LAST_POSITION_KEY = "ridezilla.lastPosition";
export const POSITION_EVENT = "ridezilla:position";
const readLastPosition = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_POSITION_KEY));
  } catch {
    return null;
  }
};

/** Remember where the rider is and tell any map on the page, so the blue "You are here" dot moves. */
export function publishPosition(here) {
  try {
    sessionStorage.setItem(LAST_POSITION_KEY, JSON.stringify(here));
  } catch {
    /* storage blocked, ignore */
  }
  window.dispatchEvent(new CustomEvent(POSITION_EVENT, { detail: here }));
}

/**
 * Starts the map on the visitor's own location instead of the whole region, and shows a "You are here" dot.
 * It never moves the camera once pickup, drop-off or a route exist, and it falls back to the Chandigarh view
 * if the browser has no location or the visitor says no.
 */
function UserLocation({ busyRef }) {
  const map = useMap();
  const [position, setPosition] = useState(readLastPosition);

  useEffect(() => {
    // The last known spot is used at once, so the map does not flash the whole country first.
    if (position && !busyRef.current) map.setView(position, 14, { animate: false });

    // Another part of the page (the "use my location" button) found the rider: move the dot.
    const onPosition = (event) => setPosition(event.detail);
    window.addEventListener(POSITION_EVENT, onPosition);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const here = [coords.latitude, coords.longitude];
          if (!inRegion(...here)) return;
          publishPosition(here);
          if (!busyRef.current) map.setView(here, 14);
        },
        () => {},
        { timeout: 8000, maximumAge: 600000 }
      );
    }
    return () => window.removeEventListener(POSITION_EVENT, onPosition);
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!position) return null;
  return (
    <CircleMarker center={position} radius={8} pathOptions={{ color: "#07090B", weight: 3, fillColor: "#38BDF8", fillOpacity: 1 }}>
      <Tooltip direction="top">You are here</Tooltip>
    </CircleMarker>
  );
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** The route line draws itself in. pathLength=1 lets one CSS animation work for any route length. */
function RouteLine({ route }) {
  const ref = useRef(null);
  const positions = useMemo(() => route.geometry.map(([lng, lat]) => [lat, lng]), [route]);

  useEffect(() => {
    const el = ref.current?.getElement?.();
    if (el && !route.estimated) el.setAttribute("pathLength", "1");
  }, [route]);

  return (
    <Polyline
      ref={ref}
      positions={positions}
      pathOptions={{
        color: route.estimated ? "#2aa8e0" : "#18b377",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        dashArray: route.estimated ? "2 10" : undefined,
        className: route.estimated ? "" : "route-line",
      }}
    />
  );
}

export default function RideMap({ pickup, dropoff, route, driver = null, driverStart = null, interactive = true, onMapClick, locateUser = false, className = "map", label = "Route map" }) {
  // Tells UserLocation not to move the camera once the rider has chosen a place or a route is showing.
  const busyRef = useRef(false);
  busyRef.current = Boolean(pickup || dropoff || route);

  return (
    <MapContainer
      className={className}
      center={REGION.center}
      zoom={REGION.zoom}
      minZoom={REGION.minZoom}
      maxZoom={REGION.maxZoom}
      maxBounds={REGION.bounds}
      maxBoundsViscosity={1}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      aria-label={label}
    >
      <TileLayer url={API.tiles} attribution={API.tileAttribution} maxZoom={19} />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={ICONS.pickup} keyboard={false} title="Pickup" />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={ICONS.drop} keyboard={false} title="Drop-off" />}
      {route && <RouteLine route={route} />}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={ICONS.driver} keyboard={false} title="Driver" zIndexOffset={1000} />}
      <FitView pickup={pickup} dropoff={dropoff} route={route} extra={driverStart} />
      {locateUser && <UserLocation busyRef={busyRef} />}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  );
}
