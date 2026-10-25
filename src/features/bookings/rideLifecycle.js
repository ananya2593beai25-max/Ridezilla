// The rules for moving a ride through its life. Every change goes through one of these thunks,
// so a vehicle or driver can never be on two rides, and the screens cannot skip a step.
//
//   requested --assign--> assigned --start--> in_progress --complete--> completed
//   Start and complete (by the driver) each need a one-time code that the client generates and tells the driver.
//   The time between the two codes is the journey time.
//   requested | assigned --cancel--> cancelled        requested | assigned --reject--> rejected

import { createAsyncThunk } from "@reduxjs/toolkit";
import { updateBooking } from "./bookingsSlice";
import { vehicleUpdated } from "../fleet/fleetSlice";
import { driverUpdated } from "../drivers/driversSlice";

const reject = (rejectWithValue, message) => rejectWithValue({ message });
const now = () => new Date().toISOString();

/** Give the vehicle and driver of an assignment back to the free pool. */
function release(dispatch, assignment) {
  if (!assignment) return;
  dispatch(vehicleUpdated({ id: assignment.fleetId, changes: { status: "available" } }));
  dispatch(driverUpdated({ id: assignment.driverId, changes: { status: "available" } }));
}

/** Admin picks a vehicle and a driver. Works for the first assignment and for a reassignment. */
export const assignRide = createAsyncThunk("rides/assign", async ({ bookingId, fleetId, driverId }, { dispatch, getState, rejectWithValue }) => {
  const state = getState();
  const booking = state.bookings.items.find((b) => b.id === bookingId);
  const vehicle = state.fleet.entities[fleetId];
  const driver = state.drivers.entities[driverId];
  const previous = booking?.assignment;

  if (!booking) return reject(rejectWithValue, "Booking not found.");
  if (!["requested", "assigned"].includes(booking.status)) return reject(rejectWithValue, "This ride can no longer be assigned.");
  if (!vehicle) return reject(rejectWithValue, "Choose a vehicle.");
  if (!driver) return reject(rejectWithValue, "Choose a driver.");
  if (vehicle.catalogueId !== booking.vehicleId) return reject(rejectWithValue, `This request needs a ${booking.vehicleName}.`);
  if (vehicle.seats < booking.passengers) return reject(rejectWithValue, "That vehicle has too few seats for this group.");
  if (!driver.active) return reject(rejectWithValue, "That driver's account is disabled.");

  // Keeping the vehicle or driver it already has is fine. Anything new must be free.
  if (vehicle.status !== "available" && previous?.fleetId !== fleetId) return reject(rejectWithValue, "That vehicle is not available.");
  if (driver.status !== "available" && previous?.driverId !== driverId) return reject(rejectWithValue, "That driver is not available.");

  if (previous && previous.fleetId !== fleetId) dispatch(vehicleUpdated({ id: previous.fleetId, changes: { status: "available" } }));
  if (previous && previous.driverId !== driverId) dispatch(driverUpdated({ id: previous.driverId, changes: { status: "available" } }));

  dispatch(vehicleUpdated({ id: fleetId, changes: { status: "on_ride" } }));
  dispatch(driverUpdated({ id: driverId, changes: { status: "on_ride" } }));
  // The client sees a copy of these details, so later edits to the vehicle do not change a booked ride.
  dispatch(
    updateBooking({
      id: bookingId,
      changes: {
        status: "assigned",
        assignment: {
          fleetId,
          driverId,
          vehicleModel: vehicle.modelName,
          plateNumber: vehicle.plateNumber,
          color: vehicle.color,
          driverName: driver.name,
          driverPhone: driver.phone,
          assignedAt: now(),
        },
      },
    })
  );
  return bookingId;
});

const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");

/** The client asks for a code: "start" once a driver is assigned (driver at the pickup), "end" once the ride is under way. */
export const generateOtp = createAsyncThunk("rides/otp", async ({ bookingId, userId, kind }, { dispatch, getState, rejectWithValue }) => {
  const booking = getState().bookings.items.find((b) => b.id === bookingId);
  if (!booking || booking.userId !== userId) return reject(rejectWithValue, "Booking not found.");
  const needs = kind === "start" ? "assigned" : "in_progress";
  if (booking.status !== needs) return reject(rejectWithValue, kind === "start" ? "A start code is only available once a driver is assigned." : "An end code is only available during the ride.");
  const existing = booking.otp?.[kind];
  if (existing?.code) return existing.code; // keep the same code if the client asks again
  const code = newCode();
  dispatch(updateBooking({ id: bookingId, changes: { otp: { ...booking.otp, [kind]: { code, generatedAt: now() } } } }));
  return code;
});

/** Checks the code the driver typed against the one the client generated. Returns an error message, or null when it matches. */
function checkOtp(booking, kind, typed) {
  const code = booking.otp?.[kind]?.code;
  if (!code) return kind === "start" ? "The client has not generated the start code yet." : "The client has not generated the end code yet.";
  if (String(typed || "").trim() !== code) return "That code is not right. Check it with the client.";
  return null;
}

/** Driver reaches the pickup and enters the client's start code. Only the assigned driver can. */
export const startRide = createAsyncThunk("rides/start", async ({ bookingId, driverId, otp }, { dispatch, getState, rejectWithValue }) => {
  const booking = getState().bookings.items.find((b) => b.id === bookingId);
  if (!booking) return reject(rejectWithValue, "Booking not found.");
  if (booking.assignment?.driverId !== driverId) return reject(rejectWithValue, "This ride is not assigned to you.");
  if (booking.status !== "assigned") return reject(rejectWithValue, "This ride cannot be started now.");
  const problem = checkOtp(booking, "start", otp);
  if (problem) return reject(rejectWithValue, problem);
  const startedAt = now();
  // The code is used up: only the time it was checked stays.
  dispatch(updateBooking({ id: bookingId, changes: { status: "in_progress", startedAt, otp: { ...booking.otp, start: { verifiedAt: startedAt } } } }));
  return bookingId;
});

/** Driver presses Complete Ride, or an admin forces it. Frees the vehicle and driver. */
export const completeRide = createAsyncThunk("rides/complete", async ({ bookingId, by, driverId, otp }, { dispatch, getState, rejectWithValue }) => {
  const booking = getState().bookings.items.find((b) => b.id === bookingId);
  if (!booking) return reject(rejectWithValue, "Booking not found.");
  if (by === "driver" && booking.assignment?.driverId !== driverId) return reject(rejectWithValue, "This ride is not assigned to you.");
  const allowed = by === "admin" ? ["assigned", "in_progress"] : ["in_progress"];
  if (!allowed.includes(booking.status)) return reject(rejectWithValue, "This ride cannot be completed now.");
  if (by === "driver") {
    const problem = checkOtp(booking, "end", otp);
    if (problem) return reject(rejectWithValue, problem);
  }
  release(dispatch, booking.assignment);
  const completedAt = now();
  // How long the journey took, from the start code to the end code. An admin closing a ride that never started has none.
  const journeySec = booking.startedAt ? Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(booking.startedAt)) / 1000)) : null;
  const otpState = by === "driver" ? { ...booking.otp, end: { verifiedAt: completedAt } } : booking.otp;
  dispatch(updateBooking({ id: bookingId, changes: { status: "completed", completedAt, journeySec, otp: otpState } }));
  return bookingId;
});

/** Client or the assigned driver cancels. A client can cancel until the ride starts. A driver can cancel once assigned, but must give a reason. */
export const cancelRide = createAsyncThunk("rides/cancel", async ({ bookingId, by, reason = "", driverId }, { dispatch, getState, rejectWithValue }) => {
  const booking = getState().bookings.items.find((b) => b.id === bookingId);
  if (!booking) return reject(rejectWithValue, "Booking not found.");
  if (by === "driver") {
    if (booking.assignment?.driverId !== driverId) return reject(rejectWithValue, "This ride is not assigned to you.");
    if (reason.trim().length < 4) return reject(rejectWithValue, "Give a reason for cancelling.");
  }
  const allowed = by === "driver" ? ["assigned", "in_progress"] : ["requested", "assigned"];
  if (!allowed.includes(booking.status)) {
    return reject(rejectWithValue, by === "client" ? "This ride has started and can no longer be cancelled." : "This ride cannot be cancelled now.");
  }
  release(dispatch, booking.assignment);
  dispatch(updateBooking({ id: bookingId, changes: { status: "cancelled", cancelledBy: by, cancelReason: reason, cancelledAt: now() } }));
  return bookingId;
});

/** Admin declines a request, with a reason the client will see. */
export const rejectRide = createAsyncThunk("rides/reject", async ({ bookingId, reason }, { dispatch, getState, rejectWithValue }) => {
  const booking = getState().bookings.items.find((b) => b.id === bookingId);
  if (!booking) return reject(rejectWithValue, "Booking not found.");
  if (!["requested", "assigned"].includes(booking.status)) return reject(rejectWithValue, "This ride cannot be rejected now.");
  release(dispatch, booking.assignment);
  dispatch(updateBooking({ id: bookingId, changes: { status: "rejected", cancelReason: reason, cancelledBy: "admin", cancelledAt: now() } }));
  return bookingId;
});
