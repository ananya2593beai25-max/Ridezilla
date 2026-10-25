// "Forgot password" requests. A rider or a driver who cannot log in asks the admin for help. The admin sees the request,
// makes a temporary password and sends it to them. They log in with it and must choose their own password at once.
// Admin accounts cannot ask: they contact the IT team.

import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from "@reduxjs/toolkit";
import { readJSON, makeId } from "../../lib/storage";
import { STORAGE } from "../../lib/config";
import { findAccount, resetToTemporaryPassword } from "./authService";

const adapter = createEntityAdapter({ sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt) });

const slice = createSlice({
  name: "passwordRequests",
  initialState: readJSON(STORAGE.resetRequests, adapter.getInitialState()),
  reducers: {
    requestAdded: adapter.addOne,
    // Every open request of this account is closed once the admin has made a new temporary password for it.
    requestsResolved(state, action) {
      const resolvedAt = new Date().toISOString();
      Object.values(state.entities).forEach((r) => {
        if (r.userId === action.payload && r.status === "open") {
          r.status = "done";
          r.resolvedAt = resolvedAt;
        }
      });
    },
    hydrate: (state, action) => action.payload,
  },
});

export const { requestAdded, requestsResolved, hydrate: hydratePasswordRequests } = slice.actions;
export default slice.reducer;

export const requestSelectors = adapter.getSelectors((state) => state.passwordRequests);

/** The user ids that have an open request, so the admin lists can flag them. */
export const selectOpenRequestUserIds = createSelector([requestSelectors.selectAll], (all) => new Set(all.filter((r) => r.status === "open").map((r) => r.userId)));

/**
 * Called from the forgot password page. The answer is always the same, so the page does not reveal which emails have an
 * account. A request is only saved for a real, active rider or driver account that has no open request yet.
 */
export const submitResetRequest = createAsyncThunk("passwordRequests/submit", async ({ email, role }, { dispatch, getState }) => {
  const account = role === "admin" ? null : findAccount(email, role);
  if (account && account.active) {
    const alreadyOpen = requestSelectors.selectAll(getState()).some((r) => r.userId === account.id && r.status === "open");
    if (!alreadyOpen) {
      dispatch(requestAdded({ id: makeId("pwr"), userId: account.id, role, name: account.name, email: account.email, status: "open", createdAt: new Date().toISOString() }));
    }
  }
  return true;
});

/** The admin makes a temporary password for a rider. Returns it once, so it can be shown and copied. */
export const resetCustomerPassword = createAsyncThunk("passwordRequests/resetCustomer", async (userId, { dispatch }) => {
  const tempPassword = await resetToTemporaryPassword(userId);
  dispatch(requestsResolved(userId));
  return tempPassword;
});
