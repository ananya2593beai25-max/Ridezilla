// Start-up work that must finish BEFORE the Redux store is created (see main.jsx), because the store reads storage on start.
//  1. Make sure the one admin account exists. Admins cannot sign up, so without it nobody could log in to /admin.
//  2. Once, remove the sample data an earlier version created: drivers, vehicles, rides, complaints and chats.
// Drivers and vehicles are now registered by the admin in the panel. The one exception is the starting fleet in features/fleet/starterFleet.js, added once.

import { readJSON, writeJSON, removeKey } from "../lib/storage";
import { STORAGE, ADMIN_ACCOUNT } from "../lib/config";
import { buildStarterFleet } from "../features/fleet/starterFleet";
import { createUser, hasAdmin, removeDriverUsers } from "../features/auth/authService";

/** Remove sample records left in this browser by the earlier version. Runs once, then never again. */
function clearOldSampleData() {
  if (readJSON(STORAGE.mockCleared, false)) return;
  [STORAGE.bookings, STORAGE.fleet, STORAGE.drivers, STORAGE.tickets, STORAGE.messages, STORAGE.sessionDriver, "ridezilla.seeded.v1"].forEach(removeKey);
  removeDriverUsers();
  writeJSON(STORAGE.mockCleared, true);
}

/** Once, give a fleet-less install the starting vehicles so the Fleet page has data. A fleet the admin already built is left alone. */
function addStarterFleet() {
  if (readJSON(STORAGE.fleetSeeded, false)) return;
  const current = readJSON(STORAGE.fleet, null);
  if (!current || !current.ids || current.ids.length === 0) writeJSON(STORAGE.fleet, buildStarterFleet());
  writeJSON(STORAGE.fleetSeeded, true);
}

export async function prepareData() {
  clearOldSampleData();
  addStarterFleet();
  if (!hasAdmin()) {
    await createUser({ name: ADMIN_ACCOUNT.name, email: ADMIN_ACCOUNT.email, phone: "", password: ADMIN_ACCOUNT.password, role: "admin" });
  }
}
