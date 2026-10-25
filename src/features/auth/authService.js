// Demo-grade accounts kept in this browser's localStorage. There is no server.
// Passwords are salted and hashed with PBKDF2 (Web Crypto), never stored as typed.
// A real app would do this on a server; the shape of the functions would stay the same.
//
// Three roles share one user list: client (self sign-up), driver (created by an admin), admin (one account, created on first run).

import { readJSON, writeJSON, removeKey, makeId } from "../../lib/storage";
import { STORAGE, SESSION_KEYS } from "../../lib/config";

const encoder = new TextEncoder();
const toB64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function hashPassword(password, saltB64) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations: 120000, hash: "SHA-256" },
    key,
    256
  );
  return toB64(bits);
}

// Accounts made before roles existed have no role field, so they count as clients.
const roleOf = (user) => user.role || "client";
const publicUser = (user) => ({
  id: user.id,
  role: roleOf(user),
  name: user.name,
  email: user.email,
  phone: user.phone,
  createdAt: user.createdAt,
  // True while the person is still using a temporary password an admin handed over. They must choose their own.
  mustChangePassword: Boolean(user.mustChangePassword),
});
const loadUsers = () => readJSON(STORAGE.users, []);

/**
 * A random temporary password: 10 letters and digits, no look-alike characters (0 O 1 l I),
 * and always at least one letter and one digit. The admin sees it once and it is never saved as text.
 */
export function generateTempPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(letters), pick(digits), ...Array.from({ length: 8 }, () => pick(letters + digits))];
  // Shuffle, so the guaranteed letter and digit are not always first.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/** Create an account of any role. Does not log anyone in. */
export async function createUser({ name, email, phone, password, role = "client", mustChangePassword = false }) {
  const users = loadUsers();
  const normalised = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalised)) {
    throw { field: "email", message: "An account with this email already exists." };
  }
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const user = {
    id: makeId("usr"),
    role,
    active: true,
    name: name.trim(),
    email: normalised,
    phone,
    salt,
    hash: await hashPassword(password, salt),
    mustChangePassword,
    createdAt: new Date().toISOString(),
  };
  if (!writeJSON(STORAGE.users, [...users, user])) {
    throw { field: "root", message: "Could not save the account. Browser storage may be blocked." };
  }
  return publicUser(user);
}

export const registerUser = (details) => createUser({ ...details, role: "client" });

/** Log in to one panel. The role must match, so a client cannot use the admin login and the reverse. */
export async function loginUser({ email, password, role = "client" }) {
  const user = loadUsers().find((u) => u.email === email.trim().toLowerCase());
  // One message for every failure, so the form does not reveal which accounts exist.
  const fail = { field: "root", message: "Email or password is incorrect." };
  if (!user || roleOf(user) !== role) throw fail;
  if (user.active === false) throw { field: "root", message: "This account is disabled. Contact the admin." };
  if ((await hashPassword(password, user.salt)) !== user.hash) throw fail;
  return publicUser(user);
}

async function writePassword(userId, password, mustChangePassword) {
  const users = loadUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw { field: "root", message: "Account not found." };
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPassword(password, salt);
  writeJSON(
    STORAGE.users,
    users.map((u) => (u.id === userId ? { ...u, salt, hash, mustChangePassword } : u))
  );
}

/** The person chooses their own password. This ends the "temporary password" state. */
export async function changePassword(userId, newPassword) {
  await writePassword(userId, newPassword, false);
  return publicUser(loadUsers().find((u) => u.id === userId));
}

/** An admin resets a forgotten or unused password. Returns the new temporary password so it can be shown once. */
export async function resetToTemporaryPassword(userId) {
  const temp = generateTempPassword();
  await writePassword(userId, temp, true);
  return temp;
}

/** Look an account up by email and role. Returns the public details plus whether it is active, or null. */
export function findAccount(email, role) {
  const user = loadUsers().find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || roleOf(user) !== role) return null;
  return { ...publicUser(user), active: user.active !== false };
}

/** All rider accounts, for the admin's Customers page. Never includes a password or its hash. */
export function listClients() {
  return loadUsers()
    .filter((u) => roleOf(u) === "client")
    .map((u) => ({ ...publicUser(u), active: u.active !== false }));
}

/** True when the typed password is the account's current one. Used before changing a password. */
export async function verifyPassword(userId, password) {
  const user = loadUsers().find((u) => u.id === userId);
  return Boolean(user) && (await hashPassword(password, user.salt)) === user.hash;
}

export function setUserActive(userId, active) {
  writeJSON(
    STORAGE.users,
    loadUsers().map((u) => (u.id === userId ? { ...u, active } : u))
  );
}

/** Delete one account for good. Used when an admin removes a driver. */
export function removeUser(userId) {
  writeJSON(
    STORAGE.users,
    loadUsers().filter((u) => u.id !== userId)
  );
}

/** Remove every driver account. Admin and client accounts stay. */
export function removeDriverUsers() {
  writeJSON(
    STORAGE.users,
    loadUsers().filter((u) => roleOf(u) !== "driver")
  );
}

export const hasAdmin = () => loadUsers().some((u) => roleOf(u) === "admin");

/* ---------- Sessions, one per role ---------- */

export const saveSession = (role, userId) => writeJSON(SESSION_KEYS[role], { userId });

export function loadSessionUser(role) {
  const session = readJSON(SESSION_KEYS[role], null);
  const user = session && loadUsers().find((u) => u.id === session.userId);
  if (!user || roleOf(user) !== role || user.active === false) return null;
  return publicUser(user);
}

export const clearSession = (role) => removeKey(SESSION_KEYS[role]);
