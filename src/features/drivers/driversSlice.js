// Redux Toolkit slice for drivers. Each driver also has a login account (role "driver") created by an admin.

import { requestsResolved } from "../auth/passwordRequestsSlice";
import { createEntityAdapter, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { readJSON, makeId } from "../../lib/storage";
import { STORAGE } from "../../lib/config";
import { createUser, setUserActive, removeUser, generateTempPassword, resetToTemporaryPassword } from "../auth/authService";

const adapter = createEntityAdapter({ sortComparer: (a, b) => a.name.localeCompare(b.name) });

const driversSlice = createSlice({
  name: "drivers",
  initialState: readJSON(STORAGE.drivers, adapter.getInitialState()),
  reducers: {
    driverAdded: adapter.addOne,
    driverUpdated: adapter.updateOne,
    driverRemoved: adapter.removeOne,
    hydrate: (state, action) => action.payload,
  },
});

export const { driverAdded, driverUpdated, driverRemoved, hydrate: hydrateDrivers } = driversSlice.actions;
export default driversSlice.reducer;

export const driverSelectors = adapter.getSelectors((state) => state.drivers);

/** The driver record that belongs to a login account. */
export const selectDriverByUserId = (state, userId) => driverSelectors.selectAll(state).find((d) => d.userId === userId);

/**
 * Create the login account first, then the driver record that points at it.
 * The admin does not choose a password. A random temporary one is made, returned once so the admin can pass it on,
 * and never saved as text. The driver must replace it at the first login.
 */
export const registerDriver = createAsyncThunk("drivers/register", async (form, { dispatch, rejectWithValue }) => {
  try {
    const tempPassword = generateTempPassword();
    const user = await createUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: tempPassword,
      role: "driver",
      mustChangePassword: true,
    });
    const driver = {
      id: makeId("drv"),
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      licenseNumber: form.licenseNumber.trim().toUpperCase(),
      status: "available", // available | on_ride | off_duty
      active: true,
      passwordPending: true, // true until the driver chooses their own password
      createdAt: new Date().toISOString(),
    };
    dispatch(driverAdded(driver));
    return { driver, tempPassword };
  } catch (error) {
    return rejectWithValue(error); // { field, message }
  }
});

/**
 * Give a driver a new temporary password, for a driver who never got the first one or forgot theirs.
 * The old password stops working at once and the driver must choose a new one at the next login.
 */
export const resetDriverPassword = createAsyncThunk("drivers/resetPassword", async (id, { dispatch, getState, rejectWithValue }) => {
  const driver = getState().drivers.entities[id];
  if (!driver) return rejectWithValue({ message: "Driver not found." });
  if (driver.status === "on_ride") return rejectWithValue({ message: "This driver is on a ride. Reset the password after the ride." });
  const tempPassword = await resetToTemporaryPassword(driver.userId);
  dispatch(driverUpdated({ id, changes: { passwordPending: true } }));
  dispatch(requestsResolved(driver.userId));
  return { driver, tempPassword };
});

/** Delete a driver and their login. Not allowed while they are on a ride. Past rides keep the driver's name. */
export const removeDriver = createAsyncThunk("drivers/remove", async (id, { dispatch, getState, rejectWithValue }) => {
  const state = getState();
  const driver = state.drivers.entities[id];
  if (!driver) return rejectWithValue({ message: "Driver not found." });
  const busy = state.bookings.items.some((b) => b.assignment?.driverId === id && ["assigned", "in_progress"].includes(b.status));
  if (driver.status === "on_ride" || busy) {
    return rejectWithValue({ message: "This driver has an active ride. Finish or reassign it first." });
  }
  removeUser(driver.userId);
  dispatch(driverRemoved(id));
  return id;
});

/** Enable or disable a driver's account. A driver on a ride cannot be disabled. */
export const setDriverActive = createAsyncThunk("drivers/setActive", async ({ id, active }, { dispatch, getState, rejectWithValue }) => {
  const driver = getState().drivers.entities[id];
  if (!driver) return rejectWithValue({ message: "Driver not found." });
  if (!active && driver.status === "on_ride") {
    return rejectWithValue({ message: "This driver is on a ride. Finish or reassign it first." });
  }
  setUserActive(driver.userId, active);
  dispatch(driverUpdated({ id, changes: { active, status: active ? "available" : "off_duty" } }));
  return id;
});
