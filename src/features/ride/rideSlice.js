// Redux Toolkit slice for the ride being planned: places, group size, time and the route between them.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRoute } from "./routing";
import { todayISO } from "../../lib/format";

/** A short string that identifies a pair of points, so we know which route a result belongs to. */
export const routeKey = (from, to) =>
  from && to ? `${from.lat.toFixed(5)},${from.lng.toFixed(5)}|${to.lat.toFixed(5)},${to.lng.toFixed(5)}` : null;

// Async thunk: runs OSRM and reports pending / fulfilled / rejected to the reducers below.
export const fetchRoute = createAsyncThunk("ride/fetchRoute", async ({ from, to }, { signal }) => getRoute(from, to, { signal }));

const nextHour = () => `${String((new Date().getHours() + 1) % 24).padStart(2, "0")}:00`;

const emptyRoute = { status: "idle", data: null, error: null, key: null, requestId: null };

const initialState = {
  pickup: null, // { name, label, lat, lng }
  dropoff: null,
  passengers: 1,
  date: todayISO(),
  time: nextHour(),
  selectedVehicleId: null,
  route: emptyRoute,
};

// The ride in progress survives a page refresh (sessionStorage), but not closing the tab.
export const RIDE_STORAGE_KEY = "ridezilla.ride";
function loadSavedRide() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(RIDE_STORAGE_KEY));
    if (!saved) return initialState;
    // A saved date or time that has already passed is dropped, so the form never starts with an invalid time.
    const n = new Date();
    const nowHHMM = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
    const stale = saved.date < todayISO() || (saved.date === todayISO() && saved.time <= nowHHMM);
    return { ...initialState, ...saved, ...(stale ? { date: initialState.date, time: initialState.time } : {}), route: emptyRoute };
  } catch {
    return initialState;
  }
}

const rideSlice = createSlice({
  name: "ride",
  initialState: loadSavedRide(),
  reducers: {
    // Called when the search form is submitted.
    setRide(state, action) {
      const { pickup, dropoff, passengers, date, time } = action.payload;
      state.pickup = pickup;
      state.dropoff = dropoff;
      state.passengers = passengers;
      state.date = date;
      state.time = time;
      state.selectedVehicleId = null;
    },
    selectVehicle(state, action) {
      state.selectedVehicleId = action.payload;
    },
    resetRide() {
      return { ...initialState, date: todayISO(), time: nextHour() };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoute.pending, (state, action) => {
        const { from, to } = action.meta.arg;
        state.route = { status: "loading", data: null, error: null, key: routeKey(from, to), requestId: action.meta.requestId };
      })
      .addCase(fetchRoute.fulfilled, (state, action) => {
        // Ignore an answer for a route the user has already changed.
        if (state.route.requestId !== action.meta.requestId) return;
        state.route.status = "ready";
        state.route.data = action.payload;
      })
      .addCase(fetchRoute.rejected, (state, action) => {
        if (state.route.requestId !== action.meta.requestId || action.meta.aborted) return;
        state.route.status = "error";
        state.route.error = action.error.message || "Could not find a route.";
      });
  },
});

export const { setRide, selectVehicle, resetRide } = rideSlice.actions;
export default rideSlice.reducer;
