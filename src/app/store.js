// The one Redux store. Sign-in sessions live in React Context instead (see context/AuthContext.jsx).
//
// Saving and live sync:
//  - Whenever a persisted slice changes, it is written to localStorage.
//  - When ANOTHER tab changes localStorage, the "storage" event fires here and we reload that slice.
//    That is how an admin tab and a client tab stay in step without a server (same browser only).

import { configureStore } from "@reduxjs/toolkit";
import rideReducer, { RIDE_STORAGE_KEY } from "../features/ride/rideSlice";
import vehiclesReducer, { hydrateRates } from "../features/vehicles/vehiclesSlice";
import bookingsReducer, { hydrateBookings } from "../features/bookings/bookingsSlice";
import fleetReducer, { hydrateFleet } from "../features/fleet/fleetSlice";
import driversReducer, { hydrateDrivers } from "../features/drivers/driversSlice";
import supportReducer, { hydrateTickets, hydrateMessages } from "../features/support/supportSlice";
import passwordRequestsReducer, { hydratePasswordRequests } from "../features/auth/passwordRequestsSlice";
import { writeJSON } from "../lib/storage";
import { STORAGE } from "../lib/config";

export const store = configureStore({
  reducer: {
    ride: rideReducer,
    vehicles: vehiclesReducer,
    bookings: bookingsReducer,
    fleet: fleetReducer,
    drivers: driversReducer,
    support: supportReducer,
    passwordRequests: passwordRequestsReducer,
  },
});

// Which part of the state is saved where, and which action loads it back.
const persisted = [
  { key: STORAGE.bookings, select: (s) => s.bookings.items, hydrate: hydrateBookings },
  { key: STORAGE.fleet, select: (s) => s.fleet, hydrate: hydrateFleet },
  { key: STORAGE.drivers, select: (s) => s.drivers, hydrate: hydrateDrivers },
  { key: STORAGE.tickets, select: (s) => s.support.tickets, hydrate: hydrateTickets },
  { key: STORAGE.messages, select: (s) => s.support.messages, hydrate: hydrateMessages },
  { key: STORAGE.resetRequests, select: (s) => s.passwordRequests, hydrate: hydratePasswordRequests },
  { key: STORAGE.rates, select: (s) => s.vehicles.rates, hydrate: hydrateRates },
];

// Remember the last saved reference of each slice, so we only write what changed.
const lastSaved = new Map(persisted.map((p) => [p.key, p.select(store.getState())]));
let lastRide = null;
let loadingFromOtherTab = false; // true while a change from another tab is being applied

store.subscribe(() => {
  const state = store.getState();

  persisted.forEach(({ key, select }) => {
    const current = select(state);
    if (current !== lastSaved.get(key)) {
      lastSaved.set(key, current);
      // A value that came from another tab is already in storage. Writing it again could overwrite a newer one and make two tabs undo each other.
      if (!loadingFromOtherTab) writeJSON(key, current);
    }
  });

  // The ride in progress survives a refresh (sessionStorage) but not closing the tab.
  const { pickup, dropoff, passengers, date, time, selectedVehicleId } = state.ride;
  const snapshot = JSON.stringify({ pickup, dropoff, passengers, date, time, selectedVehicleId });
  if (snapshot !== lastRide) {
    lastRide = snapshot;
    try {
      sessionStorage.setItem(RIDE_STORAGE_KEY, snapshot);
    } catch {
      /* storage blocked, ignore */
    }
  }
});

// Another tab saved something: load it without writing it back.
window.addEventListener("storage", (event) => {
  const entry = persisted.find((p) => p.key === event.key);
  if (!entry || event.newValue == null) return;
  loadingFromOtherTab = true;
  try {
    store.dispatch(entry.hydrate(JSON.parse(event.newValue)));
  } catch {
    /* ignore a half-written value */
  } finally {
    loadingFromOtherTab = false;
  }
});
