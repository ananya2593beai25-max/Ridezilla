// Redux Toolkit slice for bookings. Each booking carries the id of the client who made it,
// a status (see lib/bookingStatus.js) and, once an admin assigns it, a snapshot of the vehicle and driver.

import { createSlice, createSelector } from "@reduxjs/toolkit";
import { readJSON } from "../../lib/storage";
import { STORAGE } from "../../lib/config";
import { bookingTime } from "../../lib/bookingStatus";

// Bookings saved by the first version used the status "confirmed" and finished by clock time.
function normalize(booking) {
  if (booking.status !== "confirmed") return { assignment: null, ...booking };
  return { assignment: null, ...booking, status: bookingTime(booking) < new Date() ? "completed" : "requested" };
}

const bookingsSlice = createSlice({
  name: "bookings",
  initialState: { items: readJSON(STORAGE.bookings, []).map(normalize) },
  reducers: {
    addBooking(state, action) {
      state.items.push(action.payload);
    },
    addBookings(state, action) {
      state.items.push(...action.payload);
    },
    // Used by the ride lifecycle thunks: merge new values into one booking.
    updateBooking(state, action) {
      const { id, changes } = action.payload;
      const booking = state.items.find((b) => b.id === id);
      if (booking) Object.assign(booking, changes);
    },
    clearUserBookings(state, action) {
      state.items = state.items.filter((b) => b.userId !== action.payload);
    },
    // Replace everything. Used when another browser tab changed the stored data.
    hydrateBookings(state, action) {
      state.items = action.payload.map(normalize);
    },
  },
});

export const { addBooking, addBookings, updateBooking, clearUserBookings, hydrateBookings } = bookingsSlice.actions;
export default bookingsSlice.reducer;

/* ---------- Selectors ---------- */

export const selectAllBookings = (state) => state.bookings.items;

/** All bookings of one client, newest first. */
export const makeSelectUserBookings = () =>
  createSelector([selectAllBookings, (_, userId) => userId], (items, userId) =>
    items.filter((b) => b.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );

/** Every booking, newest first. For the admin. */
export const selectBookingsNewestFirst = createSelector([selectAllBookings], (items) =>
  [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

export const selectBookingById = (state, id) => state.bookings.items.find((b) => b.id === id);

/** Bookings assigned to one driver, newest first. */
export const makeSelectDriverBookings = () =>
  createSelector([selectAllBookings, (_, driverId) => driverId], (items, driverId) =>
    items
      .filter((b) => b.assignment?.driverId === driverId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
