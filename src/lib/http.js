// fetch() with a timeout and one error shape: { type, message }.
// type is "network", "timeout", "http", "aborted" or "empty".

import { REQUEST_TIMEOUT_MS } from "./config";

export async function getJSON(url, { timeout = REQUEST_TIMEOUT_MS, signal, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeout);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw { type: "http", message: `The service answered with an error (${response.status}).` };
    }
    return await response.json();
  } catch (error) {
    if (error && error.type) throw error;
    if (controller.signal.aborted) {
      if (controller.signal.reason === "timeout") {
        throw { type: "timeout", message: "The service took too long to answer." };
      }
      throw { type: "aborted", message: "Request cancelled." };
    }
    throw { type: "network", message: "Could not reach the service. Check your connection." };
  } finally {
    clearTimeout(timer);
  }
}

/** Keep a JSON result in sessionStorage so repeat lookups skip the network. */
export async function cached(key, loader) {
  try {
    const hit = sessionStorage.getItem(key);
    if (hit) return JSON.parse(hit);
  } catch {
    /* storage unavailable, continue without cache */
  }
  const value = await loader();
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode, ignore */
  }
  return value;
}
