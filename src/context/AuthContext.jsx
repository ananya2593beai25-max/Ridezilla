// Context API: who is signed in, for each of the three panels (client, admin, driver).
// useAuth() keeps working for the client site. useStaffAuth("admin" | "driver") serves the staff panels.

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { registerUser, loginUser, saveSession, loadSessionUser, clearSession, changePassword } from "../features/auth/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // The lazy initialiser runs once, so a page refresh keeps everyone signed in.
  const [sessions, setSessions] = useState(() => ({
    client: loadSessionUser("client"),
    admin: loadSessionUser("admin"),
    driver: loadSessionUser("driver"),
  }));

  const open = (role, user) => {
    saveSession(role, user.id);
    setSessions((prev) => ({ ...prev, [role]: user }));
    return user;
  };

  const register = useCallback(async (details) => open("client", await registerUser(details)), []);
  const loginAs = useCallback(async (role, credentials) => open(role, await loginUser({ ...credentials, role })), []);
  const logoutRole = useCallback((role) => {
    clearSession(role);
    setSessions((prev) => ({ ...prev, [role]: null }));
  }, []);

  // Someone who logged in with a temporary password chooses their own. The session is refreshed, so the
  // "must change password" flag clears and the app lets them through.
  const changeOwnPassword = useCallback(
    async (role, newPassword) => {
      const current = sessions[role];
      if (!current) throw { field: "root", message: "You are not logged in." };
      const updated = await changePassword(current.id, newPassword);
      setSessions((prev) => ({ ...prev, [role]: updated }));
      return updated;
    },
    [sessions]
  );

  // useMemo keeps the value stable, so consumers re-render only when a session changes.
  const value = useMemo(
    () => ({
      sessions,
      user: sessions.client,
      isAuthenticated: Boolean(sessions.client),
      register,
      login: (credentials) => loginAs("client", credentials),
      logout: () => logoutRole("client"),
      loginAs,
      logoutRole,
      changeOwnPassword,
    }),
    [sessions, register, loginAs, logoutRole, changeOwnPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Same idea as useAuth, for the admin or driver panel. */
export function useStaffAuth(role) {
  const ctx = useAuth();
  return {
    user: ctx.sessions[role],
    isAuthenticated: Boolean(ctx.sessions[role]),
    login: (credentials) => ctx.loginAs(role, credentials),
    logout: () => ctx.logoutRole(role),
    changePassword: (newPassword) => ctx.changeOwnPassword(role, newPassword),
  };
}
