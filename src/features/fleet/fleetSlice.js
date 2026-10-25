// Redux Toolkit slice for the electric vehicles the company owns (not the price catalogue in vehicles.json).
// createEntityAdapter gives ready-made add, update, remove and lookup functions for a list of records.

import { createEntityAdapter, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { readJSON } from "../../lib/storage";
import { STORAGE, SERVICE_AREA } from "../../lib/config";
import { makeId } from "../../lib/storage";

const adapter = createEntityAdapter({ sortComparer: (a, b) => a.modelName.localeCompare(b.modelName) });

/** PB65 AB-1234 and pb65ab1234 are the same plate. */
export const normalizePlate = (plate) => plate.replace(/[\s-]/g, "").toUpperCase();
export const PLATE_PATTERN = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;

const fleetSlice = createSlice({
  name: "fleet",
  initialState: readJSON(STORAGE.fleet, adapter.getInitialState()),
  reducers: {
    vehicleAdded: adapter.addOne,
    vehicleUpdated: adapter.updateOne,
    vehicleRemoved: adapter.removeOne,
    // Replace everything. Used when another browser tab changed the stored data.
    hydrate: (state, action) => action.payload,
  },
});

export const { vehicleAdded, vehicleUpdated, vehicleRemoved, hydrate: hydrateFleet } = fleetSlice.actions;
export default fleetSlice.reducer;

export const fleetSelectors = adapter.getSelectors((state) => state.fleet);

/** Add a vehicle after checking the plate. Rejects with { field, message } so the form can show it. */
export const registerVehicle = createAsyncThunk("fleet/register", async (form, { dispatch, getState, rejectWithValue }) => {
  const state = getState();
  const catalogue = state.vehicles.items.find((v) => v.id === form.catalogueId);
  if (!catalogue) return rejectWithValue({ field: "catalogueId", message: "Choose a vehicle category." });

  const area = SERVICE_AREA.find((a) => a.state === form.state);
  if (!area) return rejectWithValue({ field: "state", message: "Choose a state." });
  if (!area.cities.includes(form.city)) return rejectWithValue({ field: "city", message: "Choose a city in that state." });

  const plate = normalizePlate(form.plateNumber);
  if (!PLATE_PATTERN.test(plate)) {
    return rejectWithValue({ field: "plateNumber", message: "Use a plate like PB65AB1234." });
  }
  if (fleetSelectors.selectAll(state).some((v) => v.plateNumber === plate)) {
    return rejectWithValue({ field: "plateNumber", message: "A vehicle with this plate is already registered." });
  }

  const vehicle = {
    id: makeId("veh"),
    catalogueId: catalogue.id,
    category: catalogue.type,
    categoryName: catalogue.name,
    modelName: form.modelName.trim(),
    plateNumber: plate,
    seats: catalogue.seats,
    color: form.color.trim(),
    state: form.state,
    city: form.city,
    status: "available",
    createdAt: new Date().toISOString(),
  };
  dispatch(vehicleAdded(vehicle));
  return vehicle;
});
