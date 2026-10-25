// Redux Toolkit slice for the vehicle price catalogue. The base list comes from public/data/vehicles.json.
// An admin can change the per-km rate, minimum fare, average speed and longest ride. Those changes are kept as `rates` and laid over the file's values.

import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { getJSON } from "../../lib/http";
import { calcFare, calcCO2, seatsFit, travelMinutes, withinRange } from "../../lib/calc";
import { readJSON } from "../../lib/storage";
import { STORAGE } from "../../lib/config";

export const fetchVehicles = createAsyncThunk(
  "vehicles/fetch",
  async () => (await getJSON("/data/vehicles.json")).vehicles,
  // Skip the request when the list is already loaded or loading.
  { condition: (_, { getState }) => getState().vehicles.status === "idle" || getState().vehicles.status === "error" }
);

const withRates = (vehicles, rates) => vehicles.map((v) => ({ ...v, ...rates[v.id] }));

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState: { items: [], status: "idle", error: null, rates: readJSON(STORAGE.rates, {}) },
  reducers: {
    // Admin saves a new rate for one vehicle type. Rides already booked keep the fare they were given.
    rateUpdated(state, action) {
      const { id, ratePerKm, minFare, avgSpeedKmh, maxKm } = action.payload;
      // maxKm null means no limit, and it still replaces the limit that came from the file
      state.rates[id] = { ratePerKm, minFare, avgSpeedKmh, maxKm };
      state.items = withRates(state.items, { [id]: state.rates[id] });
    },
    // Another tab changed the saved rates.
    hydrateRates(state, action) {
      state.rates = action.payload;
      state.items = withRates(state.items, state.rates);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = withRates(action.payload, state.rates);
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Could not load vehicles.";
      });
  },
});

export const { rateUpdated, hydrateRates } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;

/* ---------- Selectors ---------- */

export const selectVehicles = (state) => state.vehicles.items;

/** Vehicles that seat the group, each with its fare and CO2 for the current route. Memoised by createSelector. */
export const selectRideRows = createSelector(
  [selectVehicles, (state) => state.ride.passengers, (state) => state.ride.route.data],
  (vehicles, passengers, route) => {
    if (!route) return [];
    return seatsFit(vehicles, passengers).map((vehicle) => ({
      vehicle,
      fare: calcFare(vehicle, route.distanceKm),
      co2: calcCO2(vehicle, route.distanceKm),
      minutes: travelMinutes(vehicle, route.distanceKm),
      tooFar: !withinRange(vehicle, route.distanceKm),
    }));
  }
);
